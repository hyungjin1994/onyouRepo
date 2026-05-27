"use client";

import { useTransition } from "react";
import { BodyPart, WorkoutType } from "@prisma/client";

import { startWorkout } from "../../actions";

export function StartTypeButton({
  type,
  bodyPart,
  emoji,
  label,
  description,
}: {
  type: WorkoutType;
  bodyPart?: BodyPart;
  emoji: string;
  label: string;
  description: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() =>
        startTransition(() =>
          startWorkout({ type, bodyPart: bodyPart ?? null }),
        )
      }
      disabled={pending}
      className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-card bg-surface py-6 shadow-card transition-colors hover:bg-bg-lavender/30 disabled:opacity-60"
    >
      <span className="text-3xl">{emoji}</span>
      <span className="text-sm font-medium">{label}</span>
      <span className="text-[10px] text-foreground-weak">{description}</span>
    </button>
  );
}
