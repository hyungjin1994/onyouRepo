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
import { updateChore } from "../../actions";

type Member = { id: string; label: string };

type Defaults = {
  title: string;
  emoji: string;
  frequency: ChoreFrequency;
  daysOfWeek: number[];
  assignmentType: AssignmentType;
  fixedAssigneeId: string | null;
  estimatedTime: number | null;
};

export function EditChoreForm({
  choreId,
  defaults,
  members,
}: {
  choreId: string;
  defaults: Defaults;
  members: Member[];
}) {
  const action = updateChore.bind(null, choreId);
  const [state, formAction, pending] = useActionState(action, undefined);

  const [title, setTitle] = useState(defaults.title);
  const [emoji, setEmoji] = useState(defaults.emoji);
  const [frequency, setFrequency] = useState<ChoreFrequency>(defaults.frequency);
  const [days, setDays] = useState<number[]>(defaults.daysOfWeek);
  const [estimatedTime, setEstimatedTime] = useState(
    defaults.estimatedTime !== null ? String(defaults.estimatedTime) : "",
  );
  const [assignmentType, setAssignmentType] = useState<AssignmentType>(
    defaults.assignmentType,
  );
  const [fixedAssigneeId, setFixedAssigneeId] = useState<string>(
    defaults.fixedAssigneeId ?? members[0]?.id ?? "",
  );

  const toggleDay = (d: number) =>
    setDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort(),
    );

  return (
    <form action={formAction} className="flex flex-col gap-5">
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

      {assignmentType === AssignmentType.FIXED && (
        <div className="flex flex-col gap-2">
          <Label>누가 담당할까요?</Label>
          <div className="grid grid-cols-2 gap-2">
            {members.map((m) => (
              <label key={m.id} className="cursor-pointer">
                <input
                  type="radio"
                  name="fixedAssigneeId"
                  value={m.id}
                  checked={fixedAssigneeId === m.id}
                  onChange={() => setFixedAssigneeId(m.id)}
                  className="peer sr-only"
                  required
                />
                <span className="flex items-center justify-center rounded-card border border-border bg-surface py-3 text-sm transition-colors peer-checked:border-lavender peer-checked:bg-bg-lavender peer-checked:font-medium">
                  {m.label}
                </span>
              </label>
            ))}
          </div>
          {state?.errors?.fixedAssigneeId?.[0] && (
            <p className="text-xs text-pink">{state.errors.fixedAssigneeId[0]}</p>
          )}
        </div>
      )}

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

      {state?.message && (
        <p className="rounded-2xl bg-bg-pink px-4 py-3 text-xs text-foreground">
          {state.message}
        </p>
      )}

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "저장 중..." : "저장하기"}
      </Button>
    </form>
  );
}
