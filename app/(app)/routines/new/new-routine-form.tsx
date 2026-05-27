"use client";

import { useActionState, useState } from "react";
import { RoutineCategory, TimeOfDay } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  ROUTINE_CATEGORY_OPTIONS,
  TIME_OF_DAY_META,
  WEEKDAY_OPTIONS,
} from "@/lib/routines";
import { createRoutine } from "../actions";

const TIME_OPTIONS: TimeOfDay[] = [
  TimeOfDay.MORNING,
  TimeOfDay.AFTERNOON,
  TimeOfDay.EVENING,
  TimeOfDay.NIGHT,
];

const DAY_PRESETS = {
  매일: [0, 1, 2, 3, 4, 5, 6],
  평일: [1, 2, 3, 4, 5],
  주말: [0, 6],
};

export function NewRoutineForm() {
  const [state, action, pending] = useActionState(createRoutine, undefined);
  const [days, setDays] = useState<number[]>(DAY_PRESETS.매일);

  const toggleDay = (day: number) =>
    setDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort(),
    );

  return (
    <form action={action} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <Label>루틴 이름</Label>
        <Input
          name="title"
          required
          placeholder="예: 비타민 D, 스트레칭 10분"
        />
        {state?.errors?.title?.[0] && (
          <p className="text-xs text-pink">{state.errors.title[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label>시간대</Label>
        <div className="grid grid-cols-4 gap-2">
          {TIME_OPTIONS.map((tod) => {
            const meta = TIME_OF_DAY_META[tod];
            return (
              <label key={tod} className="cursor-pointer">
                <input
                  type="radio"
                  name="timeOfDay"
                  value={tod}
                  defaultChecked={tod === TimeOfDay.MORNING}
                  className="peer sr-only"
                  required
                />
                <span className="flex flex-col items-center gap-1 rounded-2xl border border-border bg-surface py-3 text-xs transition-colors peer-checked:border-lavender peer-checked:bg-bg-lavender">
                  <span className="text-lg">{meta.emoji}</span>
                  {meta.label}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>카테고리</Label>
        <div className="flex flex-wrap gap-2">
          {ROUTINE_CATEGORY_OPTIONS.map((opt) => (
            <label key={opt.value} className="cursor-pointer">
              <input
                type="radio"
                name="category"
                value={opt.value}
                defaultChecked={opt.value === RoutineCategory.OTHER}
                className="peer sr-only"
                required
              />
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs transition-colors",
                  opt.chipColor,
                  "peer-checked:ring-2 peer-checked:ring-lavender",
                )}
              >
                {opt.emoji} {opt.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>요일</Label>
        <div className="flex gap-1.5">
          {Object.entries(DAY_PRESETS).map(([name, preset]) => (
            <button
              key={name}
              type="button"
              onClick={() => setDays(preset)}
              className="rounded-full bg-bg-lavender px-3 py-1 text-[11px] text-foreground-muted hover:bg-bg-lavender/80"
            >
              {name}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {WEEKDAY_OPTIONS.map((d) => {
            const checked = days.includes(d.value);
            return (
              <button
                key={d.value}
                type="button"
                onClick={() => toggleDay(d.value)}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full text-xs transition-colors",
                  checked
                    ? "bg-lavender text-white"
                    : "border border-border bg-surface text-foreground-muted",
                )}
              >
                {d.label}
              </button>
            );
          })}
        </div>
        {/* Hidden inputs so the array is submitted with the form */}
        {days.map((d) => (
          <input key={d} type="hidden" name="daysOfWeek" value={d} />
        ))}
      </div>

      {state?.message && (
        <p className="rounded-2xl bg-bg-pink px-4 py-3 text-xs text-foreground">
          {state.message}
        </p>
      )}

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "저장 중..." : "루틴 추가"}
      </Button>
    </form>
  );
}
