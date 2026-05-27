"use client";

import { useTransition } from "react";

import { deleteRoutine } from "../actions";

export function RoutineDelete({
  routineId,
  redirectTo,
}: {
  routineId: string;
  redirectTo?: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => {
        if (!confirm("이 루틴을 삭제할까요?")) return;
        startTransition(() => deleteRoutine(routineId, redirectTo));
      }}
      disabled={pending}
      className="text-xs text-foreground-weak hover:text-pink disabled:opacity-50"
    >
      삭제
    </button>
  );
}
