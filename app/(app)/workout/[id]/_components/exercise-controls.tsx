"use client";

import { useTransition } from "react";

import { addSet, removeExercise } from "../../actions";

export function AddSetButton({
  exerciseId,
  workoutId,
}: {
  exerciseId: string;
  workoutId: string;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      onClick={() => startTransition(() => addSet(exerciseId, workoutId))}
      disabled={pending}
      className="w-full rounded-xl border border-dashed border-border py-2 text-xs text-foreground-muted hover:bg-bg-lavender/40 disabled:opacity-50"
    >
      + 세트 추가
    </button>
  );
}

export function RemoveExerciseButton({
  exerciseId,
  workoutId,
}: {
  exerciseId: string;
  workoutId: string;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      onClick={() => {
        if (!confirm("이 종목을 삭제할까요?")) return;
        startTransition(() => removeExercise(exerciseId, workoutId));
      }}
      disabled={pending}
      className="text-[11px] text-foreground-weak hover:text-pink disabled:opacity-50"
    >
      삭제
    </button>
  );
}
