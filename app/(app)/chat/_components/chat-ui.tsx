"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { sendChatMessage, clearChatHistory } from "../actions";

export type ChatTurn = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

const QUICK_CHIPS = [
  "오늘 컨디션 어때요?",
  "이번 주 운동 통계 알려줘",
  "물 한 잔 마실 시간이야",
];

export function ChatUI({
  initialTurns,
  assistantName,
  configured,
  modelLabel,
}: {
  initialTurns: ChatTurn[];
  assistantName: string;
  configured: boolean;
  modelLabel: string;
}) {
  const [turns, setTurns] = useState<ChatTurn[]>(initialTurns);
  const [draft, setDraft] = useState("");
  const [toolBanner, setToolBanner] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [turns.length, pending]);

  const submit = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || pending || !configured) return;

    setTurns((prev) => [
      ...prev,
      { id: `local-${Date.now()}`, role: "user", text: trimmed },
    ]);
    setDraft("");
    setToolBanner(null);
    setError(null);

    startTransition(async () => {
      const result = await sendChatMessage(trimmed);
      if (result?.error) {
        setError(result.error);
        return;
      }
      if (result?.tools?.length) setToolBanner(result.tools);
    });
  };

  return (
    <main className="flex min-h-dvh flex-col px-4 pt-6">
      <header className="flex items-baseline justify-between px-2">
        <div>
          <h1 className="text-xl font-bold tracking-tight">🤖 {assistantName}</h1>
          <p className="text-[11px] text-foreground-muted">
            {modelLabel} · 자연어로 기록할 수 있어요
          </p>
        </div>
        {turns.length > 0 && (
          <button
            type="button"
            onClick={() => {
              if (!confirm("대화를 모두 지울까요?")) return;
              startTransition(async () => {
                await clearChatHistory();
                setTurns([]);
                setToolBanner(null);
              });
            }}
            className="text-[11px] text-foreground-weak hover:text-pink"
          >
            대화 비우기
          </button>
        )}
      </header>

      <div
        ref={scrollRef}
        className="mt-4 flex flex-1 flex-col gap-3 overflow-y-auto pb-2"
      >
        {!configured && (
          <div className="rounded-2xl bg-bg-yellow px-4 py-3 text-xs text-foreground">
            🔑 ANTHROPIC_API_KEY가 아직 설정되지 않았어요.
            <br />
            <span className="text-foreground-muted">
              .env.local에 키를 추가하면 대화를 시작할 수 있어요.
            </span>
          </div>
        )}

        {turns.length === 0 && !pending && configured && (
          <div className="mt-12 flex flex-col items-center gap-3 text-center">
            <span className="text-4xl">🌱</span>
            <p className="text-sm text-foreground-muted">
              안녕하세요! 무엇을 도와드릴까요?
              <br />
              운동·루틴·일정을 그냥 말씀해주세요.
            </p>
          </div>
        )}

        {turns.map((t) => (
          <Bubble key={t.id} role={t.role} text={t.text} />
        ))}

        {pending && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1 rounded-2xl bg-bg-lavender px-3 py-2 text-xs text-foreground-muted">
              <Dot delay={0} />
              <Dot delay={150} />
              <Dot delay={300} />
            </div>
          </div>
        )}

        {toolBanner && toolBanner.length > 0 && (
          <div className="self-start rounded-2xl bg-bg-mint px-3 py-2 text-[11px] text-foreground">
            {toolBanner.map((t, i) => (
              <div key={i}>✓ {t}</div>
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-2xl bg-bg-pink px-3 py-2 text-[11px] text-foreground">
            {error}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 pb-4">
        {turns.length === 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {QUICK_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => submit(chip)}
                className="shrink-0 rounded-full bg-bg-lavender px-3 py-1.5 text-xs text-foreground hover:brightness-95"
              >
                {chip}
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(draft);
          }}
          className="flex gap-2"
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={configured ? "무엇이든 물어보세요" : "API key 설정 필요"}
            disabled={pending || !configured}
            className="flex-1 rounded-full border border-border bg-surface px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/60 disabled:opacity-60"
          />
          <Button
            type="submit"
            size="md"
            disabled={pending || !draft.trim() || !configured}
            className="rounded-full px-4"
          >
            보내기
          </Button>
        </form>
      </div>
    </main>
  );
}

function Bubble({ role, text }: { role: "user" | "assistant"; text: string }) {
  const isUser = role === "user";
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isUser
            ? "bg-lavender text-white"
            : "bg-surface text-foreground shadow-card",
        )}
      >
        {text || (isUser ? "" : "…")}
      </div>
    </div>
  );
}

function Dot({ delay }: { delay: number }) {
  return (
    <span
      className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-foreground-muted"
      style={{ animationDelay: `${delay}ms` }}
    />
  );
}
