"use client";

import { useActionState } from "react";
import { SharedEventCategory } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SHARED_EVENT_CATEGORY_OPTIONS } from "@/lib/shared-events";
import { cn } from "@/lib/utils";
import { createSharedEvent } from "../actions";

export function SharedEventForm({ defaultDate }: { defaultDate: string }) {
  const [state, action, pending] = useActionState(createSharedEvent, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label="제목" error={state?.errors?.title?.[0]}>
        <Input name="title" required placeholder="🍕 피자 먹기" />
      </Field>

      <Field label="메모">
        <Input name="description" placeholder="선택" />
      </Field>

      <Field label="날짜" error={state?.errors?.date?.[0]}>
        <Input type="date" name="date" defaultValue={defaultDate} required />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="시작">
          <Input type="time" name="startTime" defaultValue="10:00" />
        </Field>
        <Field label="종료">
          <Input type="time" name="endTime" defaultValue="12:00" />
        </Field>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="isAllDay"
          className="h-4 w-4 accent-[var(--lavender)]"
        />
        하루 종일
      </label>

      <Field label="카테고리" error={state?.errors?.category?.[0]}>
        <div className="flex flex-wrap gap-2">
          {SHARED_EVENT_CATEGORY_OPTIONS.map((opt) => (
            <label key={opt.value} className="cursor-pointer">
              <input
                type="radio"
                name="category"
                value={opt.value}
                defaultChecked={opt.value === SharedEventCategory.DATE}
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

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="isAnniversary"
          className="h-4 w-4 accent-[var(--lavender)]"
        />
        🎂 기념일로 표시
      </label>

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "저장 중..." : "저장하기"}
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
