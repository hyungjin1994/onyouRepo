"use client";

import { useActionState, useState } from "react";
import { AssistantTone } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import { completeOnboarding } from "./actions";

type Step = 0 | 1 | 2 | 3;

type Props = {
  defaults: {
    name: string;
    height: number | null;
    weight: number | null;
    assistantName: string;
    assistantTone: AssistantTone;
  };
};

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

export function OnboardingForm({ defaults }: Props) {
  const [step, setStep] = useState<Step>(0);
  const [state, action, pending] = useActionState(completeOnboarding, undefined);

  // Controlled state so values survive step changes (they're rendered conditionally).
  const [name, setName] = useState(defaults.name);
  const [height, setHeight] = useState<string>(
    defaults.height !== null ? String(defaults.height) : "",
  );
  const [weight, setWeight] = useState<string>(
    defaults.weight !== null ? String(defaults.weight) : "",
  );
  const [assistantName, setAssistantName] = useState(defaults.assistantName);
  const [assistantTone, setAssistantTone] = useState<AssistantTone>(
    defaults.assistantTone,
  );

  const isLast = step === 3;
  const canAdvance =
    step === 0
      ? true
      : step === 1
        ? name.trim().length > 0
        : step === 2
          ? true
          : assistantName.trim().length > 0;

  return (
    <form action={action} className="flex flex-1 flex-col gap-6">
      <Progress current={step} />

      {step === 0 && (
        <StepShell
          emoji="🌱"
          title="LifeOS에 오신 걸 환영해요!"
          subtitle="나의 하루를 설계하고, 우리의 삶을 함께 관리하는 AI 비서예요. 잠깐만 설정하면 시작할 수 있어요."
        >
          <Card className="bg-bg-lavender">
            <ul className="flex flex-col gap-3 text-sm">
              <Bullet emoji="📅" text="개인 일정과 루틴을 한 곳에서" />
              <Bullet emoji="💪" text="운동 기록과 BMI 기반 AI 추천" />
              <Bullet emoji="👥" text="파트너와 함께하는 가사·장보기·가계부" />
              <Bullet emoji="🤖" text="자연어로 기록하는 AI 비서" />
            </ul>
          </Card>
        </StepShell>
      )}

      {step === 1 && (
        <StepShell
          emoji="👤"
          title="당신을 어떻게 부를까요?"
          subtitle="비서와 인사할 때 사용할 이름이에요."
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="onboard-name">이름</Label>
            <Input
              id="onboard-name"
              name="name"
              required
              autoFocus
              maxLength={20}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="형진"
            />
            {state?.errors?.name?.[0] && (
              <p className="text-xs text-pink">{state.errors.name[0]}</p>
            )}
          </div>
        </StepShell>
      )}

      {step === 2 && (
        <StepShell
          emoji="💪"
          title="신체 정보 (선택)"
          subtitle="BMI에 맞춰 안전한 운동을 추천해 드리는 데 쓰여요. 나중에 채워도 돼요."
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="onboard-height">키 (cm)</Label>
              <Input
                id="onboard-height"
                type="number"
                inputMode="decimal"
                step="0.1"
                name="height"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="175"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="onboard-weight">몸무게 (kg)</Label>
              <Input
                id="onboard-weight"
                type="number"
                inputMode="decimal"
                step="0.1"
                name="weight"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="70"
              />
            </div>
          </div>
        </StepShell>
      )}

      {step === 3 && (
        <StepShell
          emoji="🤖"
          title="AI 비서를 소개할게요"
          subtitle="이름과 말투를 정해주세요. 언제든 설정에서 바꿀 수 있어요."
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="onboard-assistant-name">비서 이름</Label>
            <Input
              id="onboard-assistant-name"
              name="assistantName"
              required
              maxLength={20}
              value={assistantName}
              onChange={(e) => setAssistantName(e.target.value)}
              placeholder="나비"
            />
            {state?.errors?.assistantName?.[0] && (
              <p className="text-xs text-pink">{state.errors.assistantName[0]}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label>말투</Label>
            <div className="grid grid-cols-2 gap-2">
              {TONE_OPTIONS.map((tone) => (
                <label key={tone.value} className="cursor-pointer">
                  <input
                    type="radio"
                    name="assistantTone"
                    value={tone.value}
                    checked={assistantTone === tone.value}
                    onChange={() => setAssistantTone(tone.value)}
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
        </StepShell>
      )}

      {/* Hidden mirrors so values from earlier steps make it into the form submission */}
      {step !== 1 && <input type="hidden" name="name" value={name} />}
      {step !== 2 && (
        <>
          <input type="hidden" name="height" value={height} />
          <input type="hidden" name="weight" value={weight} />
        </>
      )}
      {step !== 3 && (
        <>
          <input type="hidden" name="assistantName" value={assistantName} />
          <input type="hidden" name="assistantTone" value={assistantTone} />
        </>
      )}

      <div className="mt-auto flex gap-2 pt-6">
        {step > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="lg"
            onClick={() => setStep((s) => Math.max(0, s - 1) as Step)}
            className="flex-1"
          >
            이전
          </Button>
        )}
        {!isLast ? (
          <Button
            type="button"
            size="lg"
            disabled={!canAdvance}
            onClick={() => setStep((s) => Math.min(3, s + 1) as Step)}
            className="flex-1"
          >
            다음 →
          </Button>
        ) : (
          <Button
            type="submit"
            size="lg"
            disabled={pending || !canAdvance}
            className="flex-1"
          >
            {pending ? "준비 중..." : "시작하기 ✨"}
          </Button>
        )}
      </div>
    </form>
  );
}

function Progress({ current }: { current: Step }) {
  return (
    <div className="flex items-center gap-1.5" aria-label={`${current + 1}/4 단계`}>
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className={cn(
            "h-1.5 flex-1 rounded-full transition-colors",
            i <= current ? "bg-lavender" : "bg-bg-lavender/60",
          )}
        />
      ))}
    </div>
  );
}

function StepShell({
  emoji,
  title,
  subtitle,
  children,
}: {
  emoji: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <span className="text-4xl">{emoji}</span>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-sm text-foreground-muted">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

function Bullet({ emoji, text }: { emoji: string; text: string }) {
  return (
    <li className="flex items-start gap-2">
      <span>{emoji}</span>
      <span>{text}</span>
    </li>
  );
}
