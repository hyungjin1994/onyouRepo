"use client";

import { useActionState } from "react";
import { EventCategory } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EVENT_CATEGORY_OPTIONS } from "@/lib/events";
import type { EventFormState } from "../actions";
import { cn } from "@/lib/utils";

type Defaults = {
  title?: string;
  description?: string | null;
  date: string;
  startTime: string;
  endTime: string;
  isAllDay?: boolean;
  category?: EventCategory;
};

export function EventForm({
  action,
  defaults,
  submitLabel,
}: {
  action: (state: EventFormState, formData: FormData) => Promise<EventFormState>;
  defaults: Defaults;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field label="제목" error={state?.errors?.title?.[0]}>
        <Input
          name="title"
          required
          defaultValue={defaults.title ?? ""}
          placeholder="일정 제목"
        />
      </Field>

      <Field label="설명">
        <Input
          name="description"
          defaultValue={defaults.description ?? ""}
          placeholder="선택 사항"
        />
      </Field>

      <Field label="날짜" error={state?.errors?.date?.[0]}>
        <Input type="date" name="date" defaultValue={defaults.date} required />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="시작">
          <Input
            type="time"
            name="startTime"
            defaultValue={defaults.startTime}
          />
        </Field>
        <Field label="종료">
          <Input type="time" name="endTime" defaultValue={defaults.endTime} />
        </Field>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="isAllDay"
          defaultChecked={defaults.isAllDay}
          className="h-4 w-4 accent-[var(--lavender)]"
        />
        하루 종일
      </label>

      <Field label="카테고리" error={state?.errors?.category?.[0]}>
        <div className="flex flex-wrap gap-2">
          {EVENT_CATEGORY_OPTIONS.map((opt) => (
            <label key={opt.value} className="cursor-pointer">
              <input
                type="radio"
                name="category"
                value={opt.value}
                defaultChecked={(defaults.category ?? EventCategory.PERSONAL) === opt.value}
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
      </Field>

      {state?.message && (
        <p className="rounded-2xl bg-bg-pink px-4 py-3 text-xs text-foreground">
          {state.message}
        </p>
      )}

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "저장 중..." : submitLabel}
      </Button>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-pink">{error}</p>}
    </div>
  );
}
