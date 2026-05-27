import Link from "next/link";
import { notFound } from "next/navigation";
import { format, startOfDay, subDays } from "date-fns";
import { ko } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth/dal";
import { getRoutineStreak } from "@/lib/data/routines";
import { ROUTINE_CATEGORY_META, TIME_OF_DAY_META, WEEKDAY_OPTIONS } from "@/lib/routines";

import { RoutineDelete } from "../_components/routine-delete";

export const metadata = { title: "루틴 상세 · LifeOS" };

const HEATMAP_DAYS = 49; // 7주 × 7일

export default async function RoutineDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await verifySession();
  const { id } = await params;

  const routine = await prisma.routine.findFirst({
    where: { id, userId: session.userId },
  });
  if (!routine) notFound();

  const today = startOfDay(new Date());
  const since = subDays(today, HEATMAP_DAYS - 1);

  const [logs, streak, last30Logs, totalDays] = await Promise.all([
    prisma.routineLog.findMany({
      where: { routineId: id, completed: true, date: { gte: since, lte: today } },
      select: { date: true },
    }),
    getRoutineStreak(id),
    prisma.routineLog.count({
      where: {
        routineId: id,
        completed: true,
        date: { gte: subDays(today, 29), lte: today },
      },
    }),
    countActiveDays(routine.daysOfWeek, 30),
  ]);

  const catMeta = ROUTINE_CATEGORY_META[routine.category];
  const todMeta = TIME_OF_DAY_META[routine.timeOfDay];

  const completedDays = new Set(
    logs.map((l) => startOfDay(l.date).toISOString()),
  );
  const completionRate = totalDays ? Math.round((last30Logs / totalDays) * 100) : 0;

  const heatmapCells = Array.from({ length: HEATMAP_DAYS }, (_, i) => {
    const date = subDays(today, HEATMAP_DAYS - 1 - i);
    return { date, completed: completedDays.has(startOfDay(date).toISOString()) };
  });

  const dayLabels =
    routine.daysOfWeek.length === 0 || routine.daysOfWeek.length === 7
      ? "매일"
      : WEEKDAY_OPTIONS.filter((d) => routine.daysOfWeek.includes(d.value))
          .map((d) => d.label)
          .join(" · ");

  return (
    <main className="flex flex-col gap-6 px-6 pt-10 pb-6">
      <header className="flex items-center justify-between">
        <Button asChild size="sm" variant="ghost">
          <Link href="/routines">‹ 루틴</Link>
        </Button>
        <RoutineDelete routineId={routine.id} redirectTo="/routines" />
      </header>

      <section className="flex flex-col gap-2">
        <span
          className={`inline-flex w-fit items-center gap-1 rounded-full px-3 py-1 text-[11px] ${catMeta.chipColor}`}
        >
          {catMeta.emoji} {catMeta.label}
        </span>
        <h1 className="text-2xl font-bold tracking-tight">{routine.title}</h1>
        {routine.description && (
          <p className="text-sm text-foreground-muted">{routine.description}</p>
        )}
        <p className="text-xs text-foreground-muted">
          {todMeta.emoji} {todMeta.label} · {dayLabels}
        </p>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <Card className="bg-bg-peach text-center">
          <span className="text-[11px] text-foreground-muted">현재 연속</span>
          <p className="mt-1 text-2xl font-bold">
            🔥 {streak}
            <span className="ml-0.5 text-sm font-medium">일</span>
          </p>
        </Card>
        <Card className="bg-bg-mint text-center">
          <span className="text-[11px] text-foreground-muted">최근 30일 완료율</span>
          <p className="mt-1 text-2xl font-bold">
            {completionRate}
            <span className="ml-0.5 text-sm font-medium">%</span>
          </p>
          <span className="text-[10px] text-foreground-weak">
            {last30Logs} / {totalDays}일
          </span>
        </Card>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-foreground-muted">
          최근 7주
        </h2>
        <Card>
          <div className="grid grid-cols-7 gap-1.5">
            {heatmapCells.map((cell, i) => (
              <div
                key={i}
                title={`${format(cell.date, "M월 d일", { locale: ko })} ${cell.completed ? "✓" : ""}`}
                className={
                  cell.completed
                    ? "aspect-square rounded bg-lavender"
                    : "aspect-square rounded bg-bg-lavender/40"
                }
              />
            ))}
          </div>
          <div className="mt-3 flex items-center gap-3 text-[10px] text-foreground-weak">
            <span className="flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded bg-bg-lavender/40" />
              미완료
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded bg-lavender" />
              완료
            </span>
          </div>
        </Card>
      </section>

      {streak === 0 && last30Logs === 0 && (
        <Card className="bg-bg-yellow">
          <CardTitle>아직 시작 전이에요</CardTitle>
          <CardDescription className="mt-1">
            오늘부터 한 번씩 체크해보세요. 작은 시작이 모여요 ✨
          </CardDescription>
        </Card>
      )}
    </main>
  );
}

/**
 * 루틴이 활성화되는 요일을 기준으로 최근 N일 중 몇 일이 해당되는지.
 * daysOfWeek가 비어 있으면 매일 활성.
 */
function countActiveDays(daysOfWeek: number[], lookback: number): number {
  if (daysOfWeek.length === 0) return lookback;
  const today = new Date();
  let count = 0;
  for (let i = 0; i < lookback; i += 1) {
    const d = subDays(today, i);
    if (daysOfWeek.includes(d.getDay())) count += 1;
  }
  return count;
}
