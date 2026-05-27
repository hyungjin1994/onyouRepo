import Link from "next/link";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  getRecentWorkouts,
  getWeeklyWorkoutStats,
} from "@/lib/data/workouts";
import { BODY_PART_META, WORKOUT_TYPE_META } from "@/lib/workout-catalog";

export const metadata = { title: "운동 · LifeOS" };

export default async function WorkoutPage() {
  const [stats, recent] = await Promise.all([
    getWeeklyWorkoutStats(),
    getRecentWorkouts(8),
  ]);

  return (
    <main className="flex flex-col gap-6 px-6 pt-10">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">💪 운동</h1>
          <p className="text-xs text-foreground-muted">이번 주 통계</p>
        </div>
        <Button asChild size="sm">
          <Link href="/workout/new">+ 시작</Link>
        </Button>
      </header>

      <Link
        href="/workout/recommend"
        className="flex items-center gap-3 rounded-card bg-bg-lavender px-5 py-4 shadow-card"
      >
        <span className="text-2xl">🤖</span>
        <div className="flex flex-1 flex-col">
          <span className="text-sm font-bold">AI 추천 받기</span>
          <span className="text-[11px] text-foreground-muted">
            BMI와 최근 기록을 보고 오늘 어떤 운동이 좋을지 알려드려요
          </span>
        </div>
        <span className="text-foreground-weak">›</span>
      </Link>

      <section className="grid grid-cols-3 gap-2">
        <StatTile label="횟수" value={`${stats.count}회`} accent="bg-bg-mint" />
        <StatTile
          label="시간"
          value={
            stats.totalMinutes >= 60
              ? `${Math.floor(stats.totalMinutes / 60)}h ${stats.totalMinutes % 60}m`
              : `${stats.totalMinutes}분`
          }
          accent="bg-bg-lavender"
        />
        <StatTile
          label="볼륨"
          value={
            stats.totalVolume >= 1000
              ? `${(stats.totalVolume / 1000).toFixed(1)}t`
              : `${stats.totalVolume}kg`
          }
          accent="bg-bg-peach"
        />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">최근 기록</h2>
        {recent.length === 0 ? (
          <Card className="text-center text-sm text-foreground-muted">
            아직 기록이 없어요.
            <br />첫 운동을 시작해보세요!
          </Card>
        ) : (
          <ul className="flex flex-col gap-2">
            {recent.map((w) => {
              const typeMeta = WORKOUT_TYPE_META[w.type];
              const partMeta = w.bodyPart ? BODY_PART_META[w.bodyPart] : null;
              const setCount = w.exercises.reduce(
                (n, e) => n + e.sets.filter((s) => s.completed).length,
                0,
              );
              return (
                <li key={w.id}>
                  <Link
                    href={`/workout/${w.id}`}
                    className="flex items-center gap-3 rounded-2xl bg-surface px-4 py-3 shadow-card hover:bg-bg-lavender/30"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-bg-lavender text-base">
                      {typeMeta.emoji}
                    </span>
                    <div className="flex flex-1 flex-col">
                      <span className="text-sm font-medium">
                        {typeMeta.label}
                        {partMeta ? ` · ${partMeta.label}` : ""}
                      </span>
                      <span className="text-[11px] text-foreground-muted">
                        {format(w.startedAt, "M월 d일 (E) HH:mm", {
                          locale: ko,
                        })}
                        {w.duration ? ` · ${w.duration}분` : " · 진행 중"}
                        {setCount > 0 ? ` · ${setCount}세트` : ""}
                      </span>
                    </div>
                    {!w.endedAt && (
                      <span className="rounded-full bg-mint px-2 py-0.5 text-[10px] text-white">
                        진행 중
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}

function StatTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-1 rounded-2xl ${accent} py-4`}
    >
      <span className="text-xs text-foreground-muted">{label}</span>
      <span className="text-lg font-bold">{value}</span>
    </div>
  );
}
