import Link from "next/link";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { getActivePartnership } from "@/lib/data/partnership";
import { GOAL_CATEGORY_META } from "@/lib/shared-goals";
import { GoalProgress } from "./_components/goal-progress";

export const metadata = { title: "함께 목표 · LifeOS" };

export default async function GoalsPage() {
  const partnership = await getActivePartnership();
  if (!partnership) {
    return (
      <main className="px-6 pt-10">
        <Card className="text-center text-sm text-foreground-muted">
          파트너십이 필요해요.
        </Card>
      </main>
    );
  }

  const goals = await prisma.sharedGoal.findMany({
    where: { partnershipId: partnership.id },
    orderBy: [{ completedAt: "asc" }, { createdAt: "desc" }],
  });

  return (
    <main className="flex flex-col gap-6 px-6 pt-10">
      <header className="flex items-center justify-between">
        <div>
          <Link href="/shared" className="text-foreground-muted text-xs">
            ‹ 우리
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">🎯 함께 목표</h1>
          <p className="text-xs text-foreground-muted">
            함께 이루는 일들 {goals.length}개
          </p>
        </div>
        <Button asChild size="sm" variant="soft">
          <Link href="/shared/goals/new">+ 목표</Link>
        </Button>
      </header>

      {goals.length === 0 ? (
        <Card className="text-center text-sm text-foreground-muted">
          아직 함께 정한 목표가 없어요.
          <br />첫 목표를 정해보세요!
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {goals.map((goal) => {
            const meta = GOAL_CATEGORY_META[goal.category];
            const pct = goal.targetAmount
              ? Math.min(
                  100,
                  Math.round((goal.currentAmount / goal.targetAmount) * 100),
                )
              : 0;
            const done = !!goal.completedAt;

            return (
              <li key={goal.id}>
                <Card className={done ? "opacity-70" : ""}>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{goal.emoji ?? meta.emoji}</span>
                    <div className="flex flex-1 flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold">
                          {goal.title}
                          {done && " ✓"}
                        </span>
                        <span className="text-[10px] text-foreground-weak">
                          {meta.label}
                        </span>
                      </div>
                      {goal.targetAmount && (
                        <>
                          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-bg-lavender">
                            <div
                              className="h-full rounded-full bg-lavender transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <p className="text-[11px] text-foreground-muted">
                            {goal.currentAmount.toLocaleString()} /{" "}
                            {goal.targetAmount.toLocaleString()} ({pct}%)
                          </p>
                        </>
                      )}
                      {goal.targetDate && (
                        <p className="text-[10px] text-foreground-weak">
                          목표일:{" "}
                          {format(goal.targetDate, "yyyy년 M월 d일", { locale: ko })}
                        </p>
                      )}
                      {goal.targetAmount && !done && (
                        <GoalProgress
                          goalId={goal.id}
                          stepHint={
                            goal.targetAmount >= 100000 ? 10000 : 1000
                          }
                        />
                      )}
                    </div>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
