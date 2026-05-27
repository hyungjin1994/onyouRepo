import { getRecentChat } from "@/lib/data/ai";
import { ChatUI, type ChatTurn } from "./_components/chat-ui";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth/dal";
import { AI_MODEL, isAIConfigured } from "@/lib/ai/client";

export const metadata = { title: "AI 비서 · LifeOS" };

export default async function ChatPage() {
  const session = await verifySession();
  const [rows, user] = await Promise.all([
    getRecentChat(),
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { assistantName: true },
    }),
  ]);

  const turns: ChatTurn[] = rows.map((row) => {
    let text = "";
    let role: "user" | "assistant" = "user";
    try {
      const parsed = JSON.parse(row.content) as {
        role: "user" | "assistant";
        content: Array<{ type: string; text?: string }>;
      };
      role = parsed.role;
      text = parsed.content
        .filter((b) => b.type === "text" && b.text)
        .map((b) => b.text!)
        .join("\n")
        .trim();
    } catch {
      text = row.content;
    }
    // Strip the context block from the very first user message in storage
    if (text.startsWith("[컨텍스트]")) {
      const idx = text.indexOf("[/컨텍스트]");
      if (idx !== -1) text = text.slice(idx + "[/컨텍스트]".length).trim();
    }
    return { id: row.id, role, text };
  });

  return (
    <ChatUI
      initialTurns={turns}
      assistantName={user?.assistantName ?? "나비"}
      configured={isAIConfigured()}
      modelLabel={AI_MODEL}
    />
  );
}
