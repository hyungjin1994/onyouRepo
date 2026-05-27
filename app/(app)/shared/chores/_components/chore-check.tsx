"use client";

import { useTransition } from "react";

import { cn } from "@/lib/utils";
import { toggleChoreLog } from "../actions";

export function ChoreCheck({
  choreId,
  completed,
}: {
  choreId: string;
  completed: boolean;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      onClick={() => startTransition(() => toggleChoreLog(choreId))}
      disabled={pending}
      className={cn(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs transition-all",
        completed
          ? "border-mint bg-mint text-white shadow-button"
          : "border-border bg-surface hover:border-lavender",
        pending && "opacity-60",
      )}
    >
      {completed ? "✓" : ""}
    </button>
  );
}
