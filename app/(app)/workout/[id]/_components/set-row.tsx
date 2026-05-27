"use client";

import { useTransition, useState } from "react";

import { cn } from "@/lib/utils";
import { toggleSetComplete, updateSet } from "../../actions";

export function SetRow({
  setId,
  workoutId,
  setNumber,
  initialWeight,
  initialReps,
  initialCompleted,
}: {
  setId: string;
  workoutId: string;
  setNumber: number;
  initialWeight: number | null;
  initialReps: number | null;
  initialCompleted: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [weight, setWeight] = useState(
    initialWeight !== null ? String(initialWeight) : "",
  );
  const [reps, setReps] = useState(
    initialReps !== null ? String(initialReps) : "",
  );

  const persist = (next: { weight?: string; reps?: string }) => {
    const w = next.weight ?? weight;
    const r = next.reps ?? reps;
    startTransition(() => updateSet(setId, workoutId, { weight: w, reps: r }));
  };

  return (
    <div className="grid grid-cols-[28px_1fr_1fr_44px] items-center gap-2 py-1">
      <span className="text-center text-xs text-foreground-muted">
        {setNumber}
      </span>
      <input
        type="number"
        inputMode="decimal"
        step="0.5"
        placeholder="kg"
        value={weight}
        onChange={(e) => setWeight(e.target.value)}
        onBlur={(e) => persist({ weight: e.target.value })}
        className="h-9 rounded-xl border border-border bg-surface px-3 text-center text-sm focus:outline-none focus:ring-2 focus:ring-ring/60"
      />
      <input
        type="number"
        inputMode="numeric"
        placeholder="회"
        value={reps}
        onChange={(e) => setReps(e.target.value)}
        onBlur={(e) => persist({ reps: e.target.value })}
        className="h-9 rounded-xl border border-border bg-surface px-3 text-center text-sm focus:outline-none focus:ring-2 focus:ring-ring/60"
      />
      <button
        type="button"
        onClick={() =>
          startTransition(() => toggleSetComplete(setId, workoutId))
        }
        disabled={pending}
        className={cn(
          "flex h-9 items-center justify-center rounded-xl text-sm transition-colors",
          initialCompleted
            ? "bg-mint text-white"
            : "border border-border bg-surface text-foreground-muted",
        )}
        aria-label={initialCompleted ? "세트 완료 취소" : "세트 완료"}
      >
        ✓
      </button>
    </div>
  );
}
