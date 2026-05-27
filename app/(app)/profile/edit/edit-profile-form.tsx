"use client";

import { useActionState } from "react";
import { AssistantTone } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { updateProfile } from "../actions";

const TONE_OPTIONS: Array<{
  value: AssistantTone;
  label: string;
  emoji: string;
  sample: string;
}> = [
  { value: AssistantTone.FRIENDLY, label: "친근하게", emoji: "😊", sample: "좋아요! 화이팅 ✨" },
  { value: AssistantTone.POLITE,   label: "정중하게", emoji: "🎩", sample: "~하시는 것을 권장드립니다" },
  { value: AssistantTone.FUN,      label: "재미있게", emoji: "🎉", sample: "우와 대박! 👏" },
  { value: AssistantTone.STRICT,   label: "엄격하게", emoji: "💼", sample: "약속한 시간입니다." },
];

export function EditProfileForm({
  defaults,
}: {
  defaults: {
    name: string;
    height: number | null;
    weight: number | null;
    assistantName: string;
    assistantTone: AssistantTone;
  };
}) {
  const [state, action, pending] = useActionState(updateProfile, undefined);

  return (
    <form action={action} className="flex flex-col gap-6">
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-medium text-foreground-muted">기본 정보</h2>

        <Field label="이름" error={state?.errors?.name?.[0]}>
          <Input
            name="name"
            required
            defaultValue={defaults.name}
            placeholder="형진"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="키 (cm)" error={state?.errors?.height?.[0]}>
            <Input
              type="number"
              inputMode="decimal"
              step="0.1"
              name="height"
              defaultValue={defaults.height ?? ""}
              placeholder="175"
            />
          </Field>
          <Field label="몸무게 (kg)" error={state?.errors?.weight?.[0]}>
            <Input
              type="number"
              inputMode="decimal"
              step="0.1"
              name="weight"
              defaultValue={defaults.weight ?? ""}
              placeholder="70"
            />
          </Field>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-medium text-foreground-muted">AI 비서</h2>

        <Field label="비서 이름" error={state?.errors?.assistantName?.[0]}>
          <Input
            name="assistantName"
            required
            defaultValue={defaults.assistantName}
            placeholder="나비"
          />
        </Field>

        <div className="flex flex-col gap-2">
          <Label>말투</Label>
          <div className="grid grid-cols-2 gap-2">
            {TONE_OPTIONS.map((tone) => (
              <label key={tone.value} className="cursor-pointer">
                <input
                  type="radio"
                  name="assistantTone"
                  value={tone.value}
                  defaultChecked={defaults.assistantTone === tone.value}
                  className="peer sr-only"
                  required
                />
                <span
                  className={cn(
                    "flex flex-col gap-1 rounded-2xl border border-border bg-surface px-3 py-3 text-xs transition-colors",
                    "peer-checked:border-lavender peer-checked:bg-bg-lavender",
                  )}
                >
                  <span className="font-medium">
                    {tone.emoji} {tone.label}
                  </span>
                  <span className="text-[10px] text-foreground-muted">
                    {tone.sample}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </div>
      </section>

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
