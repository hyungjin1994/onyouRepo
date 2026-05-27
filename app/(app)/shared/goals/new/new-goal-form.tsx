"use client";

import { useActionState, useState } from "react";
import { GoalCategory } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { GOAL_CATEGORY_OPTIONS } from "@/lib/shared-goals";
import { createGoal } from "../actions";

export function NewGoalForm() {
  const [state, action, pending] = useActionState(createGoal, undefined);
  const [emoji, setEmoji] = useState("🎯");

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex gap-2">
        <Input
          name="emoji"
          value={emoji}
          onChange={(e) => setEmoji(e.target.value.slice(0, 4))}
          className="w-16 text-center text-base"
          maxLength={4}
        />
        <Input name="title" placeholder="목표 이름" required className="flex-1" />
      </div>
      {state?.errors?.title?.[0] && (
        <p className="text-xs text-pink">{state.errors.title[0]}</p>
      )}

      <div className="flex flex-col gap-2">
        <Label>카테고리</Label>
        <div className="flex flex-wrap gap-2">
          {GOAL_CATEGORY_OPTIONS.map((opt) => (
            <label key={opt.value} className="cursor-pointer">
              <input
                type="radio"
                name="category"
                value={opt.value}
                defaultChecked={opt.value === GoalCategory.LIFE}
                className="peer sr-only"
                required
              />
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border border-border bg-surface px-3 py-1.5 text-xs transition-colors",
                  "peer-checked:bg-bg-lavender peer-checked:border-lavender",
                )}
              >
                {opt.emoji} {opt.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>목표 금액 (선택)</Label>
        <Input
          type="number"
          inputMode="numeric"
          name="targetAmount"
          placeholder="예: 5000000 (재정 목표)"
          min={0}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>목표 날짜 (선택)</Label>
        <Input type="date" name="targetDate" />
      </div>

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "저장 중..." : "추가하기"}
      </Button>
    </form>
  );
}
