"use client";

import { useActionState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createWeightLog } from "../actions";

export function AddWeightForm({ defaultDate }: { defaultDate: string }) {
  const [state, action, pending] = useActionState(createWeightLog, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state?.ok]);

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="날짜" error={state?.errors?.date?.[0]}>
          <Input type="date" name="date" defaultValue={defaultDate} required />
        </Field>
        <Field label="몸무게 (kg)" error={state?.errors?.weight?.[0]}>
          <Input
            type="number"
            inputMode="decimal"
            step="0.1"
            name="weight"
            placeholder="70.5"
            required
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="체지방률 (%)">
          <Input
            type="number"
            inputMode="decimal"
            step="0.1"
            name="bodyFat"
            placeholder="선택"
          />
        </Field>
        <Field label="근육량 (kg)">
          <Input
            type="number"
            inputMode="decimal"
            step="0.1"
            name="muscleMass"
            placeholder="선택"
          />
        </Field>
      </div>

      <Field label="메모">
        <Input name="note" placeholder="선택 (예: 운동 후, 식전)" />
      </Field>

      <Button type="submit" size="md" disabled={pending}>
        {pending ? "저장 중..." : "기록하기"}
      </Button>

      {state?.ok && (
        <p className="text-center text-[11px] text-mint">✓ 기록 완료</p>
      )}
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
