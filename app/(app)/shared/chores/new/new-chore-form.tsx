"use client";

import { useActionState, useState } from "react";
import { AssignmentType, ChoreFrequency } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  ASSIGNMENT_TYPE_META,
  CHORE_FREQUENCY_META,
  WEEKDAY_OPTIONS,
} from "@/lib/chores";
import { createChore } from "../actions";

type Preset = {
  emoji: string;
  title: string;
  frequency: ChoreFrequency;
  daysOfWeek: number[];
  estimatedTime: number;
};

export function NewChoreForm({ presets }: { presets: Preset[] }) {
  const [state, action, pending] = useActionState(createChore, undefined);
  const [title, setTitle] = useState("");
  const [emoji, setEmoji] = useState("🧹");
  const [frequency, setFrequency] = useState<ChoreFrequency>(ChoreFrequency.WEEKLY);
  const [days, setDays] = useState<number[]>([]);
  const [estimatedTime, setEstimatedTime] = useState("20");
  const [assignmentType, setAssignmentType] = useState<AssignmentType>(
    AssignmentType.ALTERNATE,
  );

  const applyPreset = (p: Preset) => {
    setEmoji(p.emoji);
    setTitle(p.title);
    setFrequency(p.frequency);
    setDays(p.daysOfWeek);
    setEstimatedTime(String(p.estimatedTime));
  };

  const toggleDay = (d: number) =>
    setDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort(),
    );

  return (
    <form action={action} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label>빠른 추가</Label>
        <div className="flex gap-2 overflow-x-auto">
          {presets.map((p) => (
            <button
              key={p.title}
              type="button"
              onClick={() => applyPreset(p)}
              className="shrink-0 rounded-full bg-bg-lavender px-3 py-1.5 text-xs text-foreground hover:brightness-95"
            >
              {p.emoji} {p.title}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <Input
          name="emoji"
          value={emoji}
          onChange={(e) => setEmoji(e.target.value.slice(0, 4))}
          className="w-16 text-center text-base"
          maxLength={4}
        />
        <Input
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="가사 이름"
          required
          className="flex-1"
        />
      </div>
      {state?.errors?.title?.[0] && (
        <p className="text-xs text-pink">{state.errors.title[0]}</p>
      )}

      <div className="flex flex-col gap-2">
        <Label>빈도</Label>
        <div className="grid grid-cols-4 gap-2">
          {(Object.keys(CHORE_FREQUENCY_META) as ChoreFrequency[]).map((f) => (
            <label key={f} className="cursor-pointer">
              <input
                type="radio"
                name="frequency"
                value={f}
                checked={frequency === f}
                onChange={() => setFrequency(f)}
                className="peer sr-only"
                required
              />
              <span className="flex flex-col items-center gap-0.5 rounded-card border border-border bg-surface py-2 text-xs transition-colors peer-checked:border-lavender peer-checked:bg-bg-lavender">
                {CHORE_FREQUENCY_META[f].label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {(frequency === ChoreFrequency.WEEKLY ||
        frequency === ChoreFrequency.CUSTOM) && (
        <div className="flex flex-col gap-2">
          <Label>요일</Label>
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
          {days.map((d) => (
            <input key={d} type="hidden" name="daysOfWeek" value={d} />
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label>담당 방식</Label>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(ASSIGNMENT_TYPE_META) as AssignmentType[]).map((a) => (
            <label key={a} className="cursor-pointer">
              <input
                type="radio"
                name="assignmentType"
                value={a}
                checked={assignmentType === a}
                onChange={() => setAssignmentType(a)}
                className="peer sr-only"
                required
              />
              <span className="flex flex-col gap-0.5 rounded-card border border-border bg-surface px-3 py-2 text-xs transition-colors peer-checked:border-lavender peer-checked:bg-bg-lavender">
                <span className="font-medium">
                  {ASSIGNMENT_TYPE_META[a].emoji} {ASSIGNMENT_TYPE_META[a].label}
                </span>
                <span className="text-[10px] text-foreground-muted">
                  {ASSIGNMENT_TYPE_META[a].description}
                </span>
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>예상 소요 시간 (분)</Label>
        <Input
          type="number"
          inputMode="numeric"
          name="estimatedTime"
          value={estimatedTime}
          onChange={(e) => setEstimatedTime(e.target.value)}
          placeholder="20"
          min={1}
          max={600}
        />
      </div>

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "저장 중..." : "추가하기"}
      </Button>
    </form>
  );
}
