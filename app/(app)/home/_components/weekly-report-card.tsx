"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Props = {
  weekKey: string;          // e.g. "2026-05-25" — start of last week
  weekStart: string;        // ISO
  weekEnd: string;          // ISO
  workoutCount: number;
  routineRate: number;
  routineDone: number;
  weightDelta: number | null;
};

export function WeeklyReportCard(props: Props) {
  const [dismissed, setDismissed] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = window.localStorage.getItem(`weekly-report-seen:${props.weekKey}`);
    setDismissed(!!seen);
  }, [props.weekKey]);

  if (dismissed === null || dismissed) return null;

  const dismiss = () => {
    try {
      window.localStorage.setItem(`weekly-report-seen:${props.weekKey}`, "1");
    } catch {
      // ignore — private mode etc.
    }
    setDismissed(true);
  };

  const weightLabel =
    props.weightDelta === null
      ? null
      : props.weightDelta < 0
        ? `▼${Math.abs(props.weightDelta).toFixed(1)}kg`
        : props.weightDelta > 0
          ? `▲${props.weightDelta.toFixed(1)}kg`
          : "변화 없음";

  return (
    <Card className="bg-bg-lavender">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <CardTitle>📊 지난 주 리포트</CardTitle>
          <CardDescription>
            {format(new Date(props.weekStart), "M월 d일", { locale: ko })} -{" "}
            {format(new Date(props.weekEnd), "M월 d일", { locale: ko })}
          </CardDescription>
        </div>
        <button
          onClick={dismiss}
          aria-label="닫기"
          className="text-foreground-weak transition-colors hover:text-foreground-muted"
        >
          ✕
        </button>
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
        <Stat label="운동" value={`${props.workoutCount}회`} />
        <Stat
          label="루틴"
          value={`${props.routineRate}%`}
          hint={`${props.routineDone}개 완료`}
        />
        <Stat label="몸무게" value={weightLabel ?? "—"} />
      </dl>

      <Link
        href="/insights"
        className={cn(
          "mt-4 inline-flex w-full items-center justify-center rounded-full bg-surface px-4 py-2 text-xs font-medium text-foreground",
        )}
      >
        상세 보기 →
      </Link>
    </Card>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5 rounded-2xl bg-surface py-3">
      <span className="text-foreground-weak">{label}</span>
      <span className="text-sm font-bold text-foreground">{value}</span>
      {hint && <span className="text-[10px] text-foreground-weak">{hint}</span>}
    </div>
  );
}
