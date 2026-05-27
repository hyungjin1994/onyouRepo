"use client";

import { useTransition } from "react";

import { cn } from "@/lib/utils";
import { toggleRoutineLog } from "../actions";

export function RoutineCheck({
  routineId,
  completed,
}: {
  routineId: string;
  completed: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => startTransition(() => toggleRoutineLog(routineId))}
      disabled={pending}
      className={cn(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all",
        completed
          ? "border-mint bg-mint text-white shadow-button"
          : "border-border bg-surface hover:border-lavender",
        pending && "opacity-60",
      )}
      aria-label={completed ? "완료 취소" : "완료"}
    >
      {completed ? "✓" : ""}
    </button>
  );
}
