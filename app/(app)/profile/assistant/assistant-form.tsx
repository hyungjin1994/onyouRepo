"use client";

import { useActionState, useState } from "react";
import { AssistantTone } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import { updateAssistant } from "./actions";

type ToneOption = {
  value: AssistantTone;
  label: string;
  emoji: string;
  sample: (name: string) => string[];
};

const TONE_OPTIONS: ToneOption[] = [
  {
    value: AssistantTone.FRIENDLY,
    label: "친근하게",
    emoji: "😊",
    sample: (name) => [
      `안녕! 나 ${name}야`,
      "오늘 컨디션 어때요?",
      "좋아요! 화이팅 ✨",
    ],
  },
  {
    value: AssistantTone.POLITE,
    label: "정중하게",
    emoji: "🎩",
    sample: (name) => [
      `안녕하세요, ${name}입니다.`,
      "오늘 일정 안내드리겠습니다.",
      "잘하셨어요. 권장 사항이 있습니다.",
    ],
  },
  {
    value: AssistantTone.FUN,
    label: "재미있게",
    emoji: "🎉",
    sample: (name) => [
      `${name} 등장! 🪄`,
      "우와 대박! 👏 잘했어요!",
      "오늘도 슈퍼맨이네요 🦸",
    ],
  },
  {
    value: AssistantTone.STRICT,
    label: "엄격하게",
    emoji: "💼",
    sample: (name) => [
      `${name}입니다. 시작하세요.`,
      "3일째예요. 운동 시간입니다.",
      "약속한 시간입니다.",
    ],
  },
];

export function AssistantForm({
  defaults,
}: {
  defaults: { assistantName: string; assistantTone: AssistantTone };
}) {
  const [state, action, pending] = useActionState(updateAssistant, undefined);
  const [name, setName] = useState(defaults.assistantName);
  const [tone, setTone] = useState<AssistantTone>(defaults.assistantTone);

  const selectedTone = TONE_OPTIONS.find((t) => t.value === tone) ?? TONE_OPTIONS[0];

  return (
    <form action={action} className="flex flex-col gap-6">
      <section className="flex flex-col gap-2">
        <Label htmlFor="assistantName">비서 이름</Label>
        <Input
          id="assistantName"
          name="assistantName"
          required
          maxLength={20}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="나비"
        />
        {state?.errors?.assistantName?.[0] && (
          <p className="text-xs text-pink">{state.errors.assistantName[0]}</p>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <Label>말투</Label>
        <div className="grid grid-cols-2 gap-2">
          {TONE_OPTIONS.map((option) => (
            <label key={option.value} className="cursor-pointer">
              <input
                type="radio"
                name="assistantTone"
                value={option.value}
                checked={tone === option.value}
                onChange={() => setTone(option.value)}
                className="peer sr-only"
              />
              <span
                className={cn(
                  "flex flex-col gap-1 rounded-2xl border border-border bg-surface px-3 py-3 text-xs transition-colors",
                  "peer-checked:border-lavender peer-checked:bg-bg-lavender",
                )}
              >
                <span className="font-medium">
                  {option.emoji} {option.label}
                </span>
              </span>
            </label>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <Label>미리보기</Label>
        <Card className="bg-bg-lavender">
          <div className="flex flex-col gap-2">
            {selectedTone.sample(name || "나비").map((line, i) => (
              <div
                key={i}
                className="rounded-2xl bg-surface px-4 py-2 text-sm text-foreground"
              >
                {line}
              </div>
            ))}
          </div>
        </Card>
      </section>

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "저장 중..." : "저장하기"}
      </Button>
    </form>
  );
}
