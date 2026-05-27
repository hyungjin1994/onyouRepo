"use server";

import { revalidatePath } from "next/cache";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import type Anthropic from "@anthropic-ai/sdk";

import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth/dal";
import { anthropic, AI_MODEL, isAIConfigured } from "@/lib/ai/client";
import { ASSISTANT_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { ASSISTANT_TOOLS } from "@/lib/ai/tools";
import {
  executeCreateEvent,
  executeLogWeight,
  executeLogWorkout,
  executeMarkRoutineDone,
  type ToolResultPayload,
} from "@/lib/ai/executors";
import { TIME_OF_DAY_META } from "@/lib/routines";

const MAX_AGENT_TURNS = 5;

type StoredMessage = {
  role: "user" | "assistant";
  content: Anthropic.ContentBlockParam[];
};

export async function sendChatMessage(userText: string) {
  const session = await verifySession();
  const trimmed = userText.trim();
  if (!trimmed) return;
  if (!isAIConfigured()) {
    return { error: "ANTHROPIC_API_KEY가 설정되지 않았어요. .env.local에 키를 추가해주세요." };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { name: true, height: true, weight: true, assistantName: true },
  });

  const routines = await prisma.routine.findMany({
    where: { userId: session.userId },
    select: { id: true, title: true, timeOfDay: true },
    orderBy: { createdAt: "asc" },
  });

  const history = await prisma.aIInteraction.findMany({
    where: { userId: session.userId, type: "CHAT" },
    orderBy: { createdAt: "asc" },
    take: 40,
  });

  // Build the message array. Inject dynamic context (date + profile + routines) as the
  // first user message — keeps the system prompt frozen so it stays cached.
  const contextBlock = buildContextBlock(user, routines);
  const messages: Anthropic.MessageParam[] = [];

  if (history.length === 0) {
    messages.push({
      role: "user",
      content: contextBlock + "\n\n" + trimmed,
    });
  } else {
    for (const row of history) {
      const stored = parseStoredContent(row.content);
      messages.push({ role: stored.role, content: stored.content });
    }
    messages.push({ role: "user", content: trimmed });
  }

  // Persist the user message immediately
  await prisma.aIInteraction.create({
    data: {
      userId: session.userId,
      type: "CHAT",
      content: JSON.stringify({
        role: "user",
        content: [{ type: "text", text: trimmed }],
      }),
    },
  });

  // Agentic tool-use loop
  const toolBanner: string[] = [];

  for (let turn = 0; turn < MAX_AGENT_TURNS; turn++) {
    const response = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: 4096,
      system: [
        {
          type: "text",
          text: ASSISTANT_SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      tools: ASSISTANT_TOOLS,
      messages,
    });

    // Capture assistant turn into the running history
    messages.push({ role: "assistant", content: response.content });

    if (response.stop_reason === "tool_use") {
      const toolResultBlocks: Anthropic.ToolResultBlockParam[] = [];

      for (const block of response.content) {
        if (block.type !== "tool_use") continue;

        const result = await runTool(
          session.userId,
          block.name,
          block.input as Record<string, unknown>,
        );
        toolBanner.push(`${block.name}: ${result.message}`);

        toolResultBlocks.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: JSON.stringify(result),
          is_error: !result.ok,
        });
      }

      messages.push({ role: "user", content: toolResultBlocks });
      continue;
    }

    // end_turn (or other terminal): persist assistant turn and break
    const assistantText = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    await prisma.aIInteraction.create({
      data: {
        userId: session.userId,
        type: "CHAT",
        content: JSON.stringify({
          role: "assistant",
          content: response.content,
        }),
        response: assistantText || null,
      },
    });

    break;
  }

  revalidatePath("/chat");
  revalidatePath("/home");
  revalidatePath("/calendar");
  revalidatePath("/routines");
  revalidatePath("/workout");
  return { tools: toolBanner };
}

function buildContextBlock(
  user: { name: string | null; height: number | null; weight: number | null; assistantName: string } | null,
  routines: Array<{ id: string; title: string; timeOfDay: string }>,
) {
  const now = new Date();
  const today = format(now, "yyyy-MM-dd (E)", { locale: ko });

  const profileLine = (() => {
    const name = user?.name ?? "사용자";
    const h = user?.height;
    const w = user?.weight;
    if (h && w) {
      const bmi = (w / (h / 100) ** 2).toFixed(1);
      return `${name} · 키 ${h}cm · 몸무게 ${w}kg · BMI ${bmi}`;
    }
    return name;
  })();

  const routinesText = routines.length
    ? routines
        .map((r) => {
          const tod = TIME_OF_DAY_META[r.timeOfDay as keyof typeof TIME_OF_DAY_META];
          return `- ${tod?.label ?? ""} ${r.title}`;
        })
        .join("\n")
    : "(아직 등록된 루틴 없음)";

  return [
    "[컨텍스트]",
    `오늘: ${today}`,
    `사용자: ${profileLine}`,
    `등록된 루틴:\n${routinesText}`,
    "[/컨텍스트]",
  ].join("\n");
}

function parseStoredContent(raw: string): StoredMessage {
  try {
    const parsed = JSON.parse(raw) as StoredMessage;
    if (parsed.role && Array.isArray(parsed.content)) return parsed;
  } catch {
    // fall through
  }
  return { role: "user", content: [{ type: "text", text: raw }] };
}

async function runTool(
  userId: string,
  name: string,
  input: Record<string, unknown>,
): Promise<ToolResultPayload> {
  try {
    switch (name) {
      case "log_workout":
        return await executeLogWorkout(userId, input as never);
      case "mark_routine_done":
        return await executeMarkRoutineDone(userId, input as never);
      case "log_weight":
        return await executeLogWeight(userId, input as never);
      case "create_event":
        return await executeCreateEvent(userId, input as never);
      default:
        return { ok: false, message: `알 수 없는 도구: ${name}` };
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, message: `도구 실행 실패: ${msg}` };
  }
}

export async function clearChatHistory() {
  const session = await verifySession();
  await prisma.aIInteraction.deleteMany({
    where: { userId: session.userId, type: "CHAT" },
  });
  revalidatePath("/chat");
}
