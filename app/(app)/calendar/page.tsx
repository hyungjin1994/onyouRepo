import Link from "next/link";
import { format, isSameDay, parseISO } from "date-fns";
import { ko } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getEventsForMonth } from "@/lib/data/events";
import { EVENT_CATEGORY_META } from "@/lib/events";
import { MonthGrid } from "./_components/month-grid";

export const metadata = { title: "캘린더 · LifeOS" };

type SearchParams = Promise<{ date?: string }>;

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const selected = params.date ? parseISO(params.date) : new Date();
  const cursor = selected;

  const monthEvents = await getEventsForMonth(
    cursor.getFullYear(),
    cursor.getMonth(),
  );

  const dayEvents = monthEvents.filter((e) => isSameDay(e.startDate, selected));

  return (
    <main className="flex flex-col gap-6 px-6 pt-10">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">📅 캘린더</h1>
        <Button asChild size="sm" variant="soft">
          <Link href={`/calendar/new?date=${format(selected, "yyyy-MM-dd")}`}>
            + 일정
          </Link>
        </Button>
      </header>

      <MonthGrid cursor={cursor} events={monthEvents} selected={selected} />

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-foreground-muted">
          {format(selected, "M월 d일 (E)", { locale: ko })}
        </h2>

        {dayEvents.length === 0 ? (
          <Card className="text-center text-sm text-foreground-muted">
            이날은 일정이 없어요
          </Card>
        ) : (
          <ul className="flex flex-col gap-2">
            {dayEvents.map((event) => {
              const meta = EVENT_CATEGORY_META[event.category];
              return (
                <li key={event.id}>
                  <Link
                    href={`/calendar/${event.id}`}
                    className="flex items-center gap-3 rounded-2xl bg-surface px-4 py-3 shadow-card hover:bg-bg-lavender/30"
                  >
                    <span className={`flex h-9 w-9 items-center justify-center rounded-2xl text-base ${meta.chipColor}`}>
                      {meta.emoji}
                    </span>
                    <div className="flex flex-1 flex-col">
                      <span className="text-sm font-medium">{event.title}</span>
                      <span className="text-[11px] text-foreground-muted">
                        {event.isAllDay
                          ? "하루 종일"
                          : `${format(event.startDate, "HH:mm")} - ${format(event.endDate, "HH:mm")}`}
                      </span>
                    </div>
                    <span className="text-foreground-weak">›</span>
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
