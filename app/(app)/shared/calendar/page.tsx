import Link from "next/link";
import { format, isSameDay } from "date-fns";
import { ko } from "date-fns/locale";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { verifySession } from "@/lib/auth/dal";
import { getMergedUpcomingCalendar } from "@/lib/data/shared-calendar";
import { cn } from "@/lib/utils";
import { deleteSharedEvent } from "./actions";

export const metadata = { title: "공동 캘린더 · LifeOS" };

export default async function SharedCalendarPage() {
  const session = await verifySession();
  const merged = await getMergedUpcomingCalendar();

  if (!merged) {
    return (
      <main className="px-6 pt-10">
        <Card className="text-center text-sm text-foreground-muted">
          파트너십이 필요해요.
        </Card>
      </main>
    );
  }

  const sharedCount = merged.entries.filter((e) => e.source === "SHARED").length;
  const conflicts = merged.entries.filter(
    (e) => e.source === "SHARED" && e.conflictsWith.length > 0,
  );

  // Group by day for friendlier scanning.
  const days = groupByDay(merged.entries);

  return (
    <main className="flex flex-col gap-6 px-6 pt-10 pb-6">
      <header className="flex items-center justify-between">
        <div>
          <Link href="/shared" className="text-foreground-muted text-xs">
            ‹ 우리
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">📅 공동 캘린더</h1>
          <p className="text-xs text-foreground-muted">
            함께하는 일정 {sharedCount}개 · 다음 60일
          </p>
        </div>
        <Button asChild size="sm" variant="soft">
          <Link href="/shared/calendar/new">+ 일정</Link>
        </Button>
      </header>

      {conflicts.length > 0 && (
        <Card className="bg-bg-yellow">
          <p className="text-sm font-medium">⚠️ 시간 겹침</p>
          <p className="mt-1 text-xs text-foreground-muted">
            공동 일정 {conflicts.length}건이 누군가의 다른 일정과 겹쳐요.
            아래에서 확인해보세요.
          </p>
        </Card>
      )}

      {merged.entries.filter((e) => e.source === "SHARED").length === 0 ? (
        <Card className="text-center text-sm text-foreground-muted">
          예정된 공동 일정이 없어요.
          <br />첫 데이트를 잡아볼까요?
        </Card>
      ) : (
        <ul className="flex flex-col gap-5">
          {days.map(({ date, entries }) => (
            <li key={date.toISOString()} className="flex flex-col gap-2">
              <h2 className="text-sm font-medium text-foreground-muted">
                {format(date, "M월 d일 (E)", { locale: ko })}
              </h2>
              <ul className="flex flex-col gap-2">
                {entries.map((entry) => (
                  <EntryRow
                    key={entry.id}
                    entry={entry}
                    currentUserId={session.userId}
                    ownerId={merged.ownerId}
                  />
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

type Entry = NonNullable<
  Awaited<ReturnType<typeof getMergedUpcomingCalendar>>
>["entries"][number];

function EntryRow({
  entry,
  currentUserId,
  ownerId,
}: {
  entry: Entry;
  currentUserId: string;
  ownerId: string;
}) {
  const hasConflict = entry.conflictsWith.length > 0;
  const isMine = entry.ownerId === currentUserId;

  // For personal entries we hide titles of the other person's events for privacy.
  let displayTitle: string;
  let badge: string;
  let accent: string;
  if (entry.source === "SHARED") {
    displayTitle = entry.title;
    badge = "💑 함께";
    accent = "bg-bg-lavender";
  } else if (isMine) {
    displayTitle = entry.title;
    badge = "👤 내 일정";
    accent = "bg-bg-mint";
  } else {
    displayTitle = "다른 일정 (비공개)";
    const ownerLabel = entry.ownerId === ownerId ? "" : ""; // both branches resolve to same label below
    badge = `🔒 파트너${ownerLabel}`;
    accent = "bg-bg-peach";
  }

  const sharedId =
    entry.source === "SHARED" ? entry.id.replace(/^s:/, "") : null;
  const deleteAction = sharedId ? deleteSharedEvent.bind(null, sharedId) : null;

  return (
    <li
      className={cn(
        "flex items-center gap-3 rounded-card bg-surface px-4 py-3 shadow-card",
        hasConflict && entry.source === "SHARED" && "ring-2 ring-yellow",
      )}
    >
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-card text-base ${accent}`}
      >
        {entry.isAllDay ? "🗓" : "🕒"}
      </span>
      <div className="flex flex-1 flex-col">
        <span className="text-sm font-medium">
          {displayTitle}
          {hasConflict && entry.source === "SHARED" && (
            <span className="ml-1 text-xs text-pink">⚠️</span>
          )}
        </span>
        <span className="text-[11px] text-foreground-muted">
          {badge} ·{" "}
          {entry.isAllDay
            ? "하루 종일"
            : `${format(entry.startDate, "HH:mm")}-${format(entry.endDate, "HH:mm")}`}
        </span>
      </div>
      {deleteAction && (
        <form action={deleteAction}>
          <button
            type="submit"
            className="text-[11px] text-foreground-weak hover:text-pink"
          >
            삭제
          </button>
        </form>
      )}
    </li>
  );
}

function groupByDay(entries: Entry[]) {
  const days: { date: Date; entries: Entry[] }[] = [];
  for (const entry of entries) {
    const lastDay = days[days.length - 1];
    if (lastDay && isSameDay(lastDay.date, entry.startDate)) {
      lastDay.entries.push(entry);
    } else {
      days.push({ date: entry.startDate, entries: [entry] });
    }
  }
  return days;
}
