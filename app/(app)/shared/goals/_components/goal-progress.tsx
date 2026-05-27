"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateGoalProgress } from "../actions";

export function GoalProgress({
  goalId,
  stepHint,
}: {
  goalId: string;
  stepHint: number;
}) {
  const [amount, setAmount] = useState(String(stepHint));
  const [pending, startTransition] = useTransition();

  const add = (sign: 1 | -1) => {
    const n = Number(amount);
    if (!n || Number.isNaN(n)) return;
    startTransition(() => updateGoalProgress(goalId, sign * Math.abs(n)));
  };

  return (
    <div className="mt-2 flex gap-2">
      <Input
        type="number"
        inputMode="numeric"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="h-9 flex-1 text-sm"
        min={0}
      />
      <Button
        type="button"
        size="sm"
        variant="soft"
        disabled={pending}
        onClick={() => add(-1)}
        className="px-3"
      >
        -
      </Button>
      <Button
        type="button"
        size="sm"
        disabled={pending}
        onClick={() => add(1)}
        className="px-3"
      >
        +
      </Button>
    </div>
  );
}
