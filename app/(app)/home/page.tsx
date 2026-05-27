import Link from "next/link";
import { format, startOfToday, subWeeks } from "date-fns";
import { ko } from "date-fns/locale";

import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { ensureUserRow, verifySession } from "@/lib/auth/dal";
import { getEventsForDay } from "@/lib/data/events";
import { getRoutinesForToday } from "@/lib/data/routines";
import { getWeeklyReport } from "@/lib/data/insights";
import { EVENT_CATEGORY_META } from "@/lib/events";
import { ROUTINE_CATEGORY_META, TIME_OF_DAY_META } from "@/lib/routines";

import { WeeklyReportCard } from "./_components/weekly-report-card";

export const metadata = { title: "홈 · LifeOS" };

export default async function HomePage() {
  await ensureUserRow();
  const session = await verifySession();
  const today = startOfToday();
  const isMonday = today.getDay() === 1;

  const [todayEvents, todayRoutines, weeklyReport] = await Promise.all([
    getEventsForDay(today),
    getRoutinesForToday(today),
    isMonday ? getWeeklyReport(subWeeks(today, 1)) : Promise.resolve(null),
  ]);

  const completed = todayRoutines.filter((r) => r.todayLog?.completed).length;
  const greeting = pickGreeting();

  return (
    <main className="flex flex-col gap-6 px-6 pt-10">
      <header className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-xs text-foreground-muted">
            {greeting.emoji} {greeting.label}
          </p>
          <h1 className="text-2xl font-bold tracking-tight">
            {format(today, "M월 d일 (E)", { locale: ko })}
          </h1>
          <p className="text-sm text-foreground-muted">{session.email}</p>
        </div>
        <Link
          href="/notifications"
          aria-label="알림 센터"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-surface text-lg shadow-card hover:bg-bg-lavender/40"
        >
          🔔
        </Link>
      </header>

      {weeklyReport && (
        <WeeklyReportCard
          weekKey={weeklyReport.weekStart.toISOString().slice(0, 10)}
          weekStart={weeklyReport.weekStart.toISOString()}
          weekEnd={weeklyReport.weekEnd.toISOString()}
          workoutCount={weeklyReport.workoutCount}
          routineRate={weeklyReport.routineRate}
          routineDone={weeklyReport.routineDone}
          weightDelta={weeklyReport.weightDelta}
        />
      )}

      <Link
        href="/chat"
        className="flex items-center gap-3 rounded-card bg-lavender px-5 py-4 text-white shadow-card"
      >
        <span className="text-2xl">🤖</span>
        <div className="flex flex-1 flex-col">
          <span className="text-sm font-bold">AI 비서와 대화하기</span>
          <span className="text-[11px] opacity-90">
            "벤치프레스 60kg 10회" 같이 자연어로 기록할 수 있어요
          </span>
        </div>
        <span>›</span>
      </Link>

      {/* Today's events */}
      <section className="flex flex-col gap-2">
        <SectionHeader title="📅 오늘 일정" href="/calendar" />
        {todayEvents.length === 0 ? (
          <EmptyCard hint="새 일정을 추가해보세요" href="/calendar/new" cta="+ 일정 추가" />
        ) : (
          <ul className="flex flex-col gap-2">
            {todayEvents.slice(0, 3).map((e) => {
              const meta = EVENT_CATEGORY_META[e.category];
              return (
                <li key={e.id}>
                  <Link
                    href={`/calendar/${e.id}`}
                    className="flex items-center gap-3 rounded-2xl bg-surface px-4 py-3 shadow-card hover:bg-bg-lavender/30"
                  >
                    <span className={`flex h-9 w-9 items-center justify-center rounded-2xl text-base ${meta.chipColor}`}>
                      {meta.emoji}
                    </span>
                    <div className="flex flex-1 flex-col">
                      <span className="text-sm font-medium">{e.title}</span>
                      <span className="text-[11px] text-foreground-muted">
                        {e.isAllDay
                          ? "하루 종일"
                          : `${format(e.startDate, "HH:mm")} - ${format(e.endDate, "HH:mm")}`}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
            {todayEvents.length > 3 && (
              <Link
                href="/calendar"
                className="text-center text-xs text-foreground-muted"
              >
                + {todayEvents.length - 3}개 더 보기
              </Link>
            )}
          </ul>
        )}
      </section>

      {/* Today's routines */}
      <section className="flex flex-col gap-2">
        <SectionHeader
          title={`✓ 오늘 루틴 ${todayRoutines.length ? `(${completed}/${todayRoutines.length})` : ""}`}
          href="/routines"
        />
        {todayRoutines.length === 0 ? (
          <EmptyCard hint="작은 변화부터 시작해요" href="/routines/new" cta="+ 첫 루틴 만들기" />
        ) : (
          <ul className="flex flex-col gap-2">
            {todayRoutines.slice(0, 4).map((r) => {
              const cat = ROUTINE_CATEGORY_META[r.category];
              const tod = TIME_OF_DAY_META[r.timeOfDay];
              const done = !!r.todayLog?.completed;
              return (
                <li
                  key={r.id}
                  className="flex items-center gap-3 rounded-2xl bg-surface px-4 py-3 shadow-card"
                >
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-sm ${
                      done
                        ? "bg-mint text-white"
                        : "border border-border bg-surface"
                    }`}
                  >
                    {done ? "✓" : ""}
                  </span>
                  <div className="flex flex-1 flex-col">
                    <span
                      className={
                        done
                          ? "text-sm text-foreground-muted line-through"
                          : "text-sm"
                      }
                    >
                      {cat.emoji} {r.title}
                    </span>
                    <span className="text-[11px] text-foreground-weak">
                      {tod.emoji} {tod.label}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}

function SectionHeader({ title, href }: { title: string; href: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-sm font-medium">{title}</h2>
      <Link href={href} className="text-xs text-foreground-weak">
        전체 보기 ›
      </Link>
    </div>
  );
}

function EmptyCard({
  hint,
  href,
  cta,
}: {
  hint: string;
  href: string;
  cta: string;
}) {
  return (
    <Card className="text-center">
      <CardDescription>{hint}</CardDescription>
      <Link
        href={href}
        className="mt-2 inline-flex items-center justify-center self-center rounded-full bg-bg-lavender px-4 py-1.5 text-xs text-foreground"
      >
        {cta}
      </Link>
    </Card>
  );
}

function pickGreeting() {
  const h = new Date().getHours();
  if (h < 11) return { emoji: "🌅", label: "좋은 아침이에요" };
  if (h < 14) return { emoji: "🌞", label: "점심 시간" };
  if (h < 18) return { emoji: "☀️", label: "기분 좋은 오후" };
  if (h < 22) return { emoji: "🌆", label: "수고한 저녁" };
  return { emoji: "🌙", label: "편안한 밤이에요" };
}
