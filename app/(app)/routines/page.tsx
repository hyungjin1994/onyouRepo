import Link from "next/link";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { TimeOfDay } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getRoutinesForToday, getRoutineStreak } from "@/lib/data/routines";
import { ROUTINE_CATEGORY_META, TIME_OF_DAY_META } from "@/lib/routines";
import { RoutineCheck } from "./_components/routine-check";
import { RoutineDelete } from "./_components/routine-delete";
import { cn } from "@/lib/utils";

export const metadata = { title: "루틴 · LifeOS" };

const SECTION_ORDER: TimeOfDay[] = [
  TimeOfDay.MORNING,
  TimeOfDay.AFTERNOON,
  TimeOfDay.EVENING,
  TimeOfDay.NIGHT,
  TimeOfDay.CUSTOM,
];

export default async function RoutinesPage() {
  const today = new Date();
  const routines = await getRoutinesForToday(today);

  const streaks = Object.fromEntries(
    await Promise.all(
      routines.map(async (r) => [r.id, await getRoutineStreak(r.id)] as const),
    ),
  );

  const completedCount = routines.filter((r) => r.todayLog?.completed).length;
  const progress = routines.length
    ? Math.round((completedCount / routines.length) * 100)
    : 0;

  const grouped = SECTION_ORDER.map((tod) => ({
    tod,
    items: routines.filter((r) => r.timeOfDay === tod),
  })).filter((g) => g.items.length > 0);

  return (
    <main className="flex flex-col gap-6 px-6 pt-10">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">✓ 오늘 루틴</h1>
          <p className="text-xs text-foreground-muted">
            {format(today, "M월 d일 (E)", { locale: ko })} · {completedCount}/
            {routines.length} 완료
          </p>
        </div>
        <Button asChild size="sm" variant="soft">
          <Link href="/routines/new">+ 루틴</Link>
        </Button>
      </header>

      {routines.length > 0 && (
        <div className="h-2 w-full overflow-hidden rounded-full bg-bg-lavender">
          <div
            className="h-full rounded-full bg-lavender transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {routines.length === 0 ? (
        <Card className="text-center">
          <p className="text-sm text-foreground-muted">
            아직 루틴이 없어요.
            <br />
            작은 것부터 하나씩 만들어보세요.
          </p>
          <Button asChild size="sm" variant="soft" className="mt-3 self-center">
            <Link href="/routines/new">첫 루틴 만들기</Link>
          </Button>
        </Card>
      ) : (
        <div className="flex flex-col gap-5">
          {grouped.map(({ tod, items }) => {
            const meta = TIME_OF_DAY_META[tod];
            return (
              <section key={tod} className="flex flex-col gap-2">
                <h2 className="flex items-baseline gap-2 text-sm font-medium">
                  <span className="text-base">{meta.emoji}</span>
                  {meta.label}
                  <span className="text-[11px] text-foreground-weak">
                    {meta.hours}
                  </span>
                </h2>
                <ul className="flex flex-col gap-2">
                  {items.map((r) => {
                    const cat = ROUTINE_CATEGORY_META[r.category];
                    const done = !!r.todayLog?.completed;
                    const streak = streaks[r.id] ?? 0;
                    return (
                      <li
                        key={r.id}
                        className={cn(
                          "flex items-center gap-3 rounded-2xl bg-surface px-4 py-3 shadow-card transition-opacity",
                          done && "opacity-70",
                        )}
                      >
                        <RoutineCheck routineId={r.id} completed={done} />
                        <Link
                          href={`/routines/${r.id}`}
                          className="flex flex-1 flex-col"
                        >
                          <span
                            className={cn(
                              "text-sm font-medium",
                              done && "text-foreground-muted line-through",
                            )}
                          >
                            {cat.emoji} {r.title}
                          </span>
                          {streak > 0 && (
                            <span className="text-[11px] text-foreground-muted">
                              🔥 {streak}일 연속
                            </span>
                          )}
                        </Link>
                        <RoutineDelete routineId={r.id} />
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}
