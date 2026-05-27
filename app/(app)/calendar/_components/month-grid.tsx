import Link from "next/link";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ko } from "date-fns/locale";

import { cn } from "@/lib/utils";
import { EVENT_CATEGORY_META } from "@/lib/events";
import type { Event } from "@prisma/client";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export function MonthGrid({
  cursor,
  events,
  selected,
}: {
  cursor: Date;
  events: Event[];
  selected: Date;
}) {
  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const prevMonth = format(subMonths(cursor, 1), "yyyy-MM-01");
  const nextMonth = format(addMonths(cursor, 1), "yyyy-MM-01");

  return (
    <section className="flex flex-col gap-3">
      <header className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight">
          {format(cursor, "yyyy년 M월", { locale: ko })}
        </h2>
        <div className="flex items-center gap-1">
          <Link
            href={`/calendar?date=${prevMonth}`}
            className="flex h-9 w-9 items-center justify-center rounded-full text-foreground-muted hover:bg-bg-lavender/60"
            aria-label="이전 달"
          >
            ‹
          </Link>
          <Link
            href={`/calendar?date=${format(new Date(), "yyyy-MM-dd")}`}
            className="rounded-full px-3 text-xs text-foreground-muted hover:bg-bg-lavender/60"
          >
            오늘
          </Link>
          <Link
            href={`/calendar?date=${nextMonth}`}
            className="flex h-9 w-9 items-center justify-center rounded-full text-foreground-muted hover:bg-bg-lavender/60"
            aria-label="다음 달"
          >
            ›
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-7 text-center text-[11px] text-foreground-weak">
        {WEEKDAYS.map((w, i) => (
          <div
            key={w}
            className={cn(i === 0 && "text-pink", i === 6 && "text-sky")}
          >
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {days.map((day) => {
          const inMonth = isSameMonth(day, cursor);
          const isSelected = isSameDay(day, selected);
          const today = isToday(day);
          const dayEvents = events.filter((e) => isSameDay(e.startDate, day));
          const dots = dayEvents.slice(0, 3);
          const dow = day.getDay();

          return (
            <Link
              key={day.toISOString()}
              href={`/calendar?date=${format(day, "yyyy-MM-dd")}`}
              className={cn(
                "flex aspect-square flex-col items-center justify-start gap-1 rounded-2xl py-1.5 text-sm transition-colors",
                !inMonth && "text-foreground-weak",
                inMonth && "text-foreground",
                dow === 0 && inMonth && "text-pink",
                dow === 6 && inMonth && "text-sky",
                isSelected && "bg-lavender text-white",
                !isSelected && today && "ring-1 ring-lavender",
                !isSelected && "hover:bg-bg-lavender/60",
              )}
            >
              <span className={cn("text-[13px]", today && !isSelected && "font-bold")}>
                {format(day, "d")}
              </span>
              <span className="flex h-1 items-center gap-0.5">
                {dots.map((e) => (
                  <span
                    key={e.id}
                    className={cn(
                      "h-1 w-1 rounded-full",
                      isSelected ? "bg-white/80" : EVENT_CATEGORY_META[e.category].dotColor,
                    )}
                  />
                ))}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
