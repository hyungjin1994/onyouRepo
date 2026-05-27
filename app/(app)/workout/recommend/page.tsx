import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { verifySession } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import {
  getBodyPartCounts,
  getWeeklyWorkoutStats,
} from "@/lib/data/workouts";
import {
  BMI_TIER_META,
  buildRecommendations,
  classifyBmi,
  computeBmi,
  DIFFICULTY_META,
} from "@/lib/workout-recommend";
import { BODY_PART_META } from "@/lib/workout-catalog";

export const metadata = { title: "운동 추천 · LifeOS" };

export default async function RecommendPage() {
  const session = await verifySession();
  const [user, bodyPartCounts, weekly] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { height: true, weight: true, assistantName: true },
    }),
    getBodyPartCounts(),
    getWeeklyWorkoutStats(),
  ]);

  if (!user?.height || !user?.weight) {
    return (
      <main className="flex flex-col gap-6 px-6 pt-10">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">🤖 운동 추천</h1>
          <Button asChild size="sm" variant="ghost">
            <Link href="/workout">‹ 뒤로</Link>
          </Button>
        </header>

        <Card className="bg-bg-yellow">
          <CardTitle>먼저 키와 몸무게를 알려주세요</CardTitle>
          <CardDescription className="mt-1">
            BMI에 맞춰 안전한 운동을 추천해 드릴 수 있어요.
          </CardDescription>
          <Button asChild className="mt-4" variant="primary">
            <Link href="/profile/edit">프로필 입력하러 가기</Link>
          </Button>
        </Card>
      </main>
    );
  }

  const bmi = computeBmi(user.height, user.weight);
  const tier = classifyBmi(bmi);
  const tierMeta = BMI_TIER_META[tier];
  const recs = buildRecommendations({
    tier,
    bodyPartCounts,
    workoutsThisWeek: weekly.count,
  });

  const sortedParts = (Object.keys(bodyPartCounts) as (keyof typeof BODY_PART_META)[])
    .sort((a, b) => bodyPartCounts[a] - bodyPartCounts[b]);

  return (
    <main className="flex flex-col gap-6 px-6 pt-10 pb-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">🤖 운동 추천</h1>
        <Button asChild size="sm" variant="ghost">
          <Link href="/workout">‹ 뒤로</Link>
        </Button>
      </header>

      <Card className={tierMeta.accent}>
        <div className="flex items-baseline justify-between gap-3">
          <CardTitle>BMI {bmi.toFixed(1)}</CardTitle>
          <span className="rounded-full bg-surface/70 px-3 py-1 text-xs font-medium text-foreground">
            {tierMeta.label}
          </span>
        </div>
        <CardDescription className="mt-1">{tierMeta.description}</CardDescription>
      </Card>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-foreground-muted">
          오늘의 추천 ({weekly.count}회 / 이번 주)
        </h2>
        <ul className="flex flex-col gap-2">
          {recs.map((rec) => {
            const diff = DIFFICULTY_META[rec.difficulty];
            return (
              <li key={rec.id}>
                <Link
                  href={rec.href}
                  className="flex items-center gap-3 rounded-card bg-surface px-4 py-4 shadow-card hover:bg-bg-lavender/30"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-bg-lavender text-xl">
                    {rec.emoji}
                  </span>
                  <div className="flex flex-1 flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{rec.title}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] ${diff.accent}`}
                      >
                        {diff.emoji} {diff.label}
                      </span>
                    </div>
                    <span className="text-[11px] text-foreground-muted">{rec.reason}</span>
                  </div>
                  <span className="text-foreground-weak">›</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-foreground-muted">
          최근 30일 부위별 균형
        </h2>
        <Card>
          <ul className="flex flex-col gap-2 text-xs">
            {sortedParts.map((part) => {
              const meta = BODY_PART_META[part];
              const count = bodyPartCounts[part];
              const max = Math.max(1, ...Object.values(bodyPartCounts));
              const pct = Math.round((count / max) * 100);
              return (
                <li key={part} className="flex items-center gap-3">
                  <span className="w-12 text-foreground-muted">
                    {meta.emoji} {meta.label}
                  </span>
                  <div className="flex-1 overflow-hidden rounded-full bg-bg-lavender/50">
                    <div
                      className="h-2 rounded-full bg-lavender"
                      style={{ width: `${Math.max(8, pct)}%` }}
                    />
                  </div>
                  <span className="w-8 text-right tabular-nums text-foreground-muted">
                    {count}회
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>
      </section>
    </main>
  );
}
