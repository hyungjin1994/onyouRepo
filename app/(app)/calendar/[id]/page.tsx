import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getEventById } from "@/lib/data/events";
import { deleteEvent } from "../actions";
import { EVENT_CATEGORY_META } from "@/lib/events";

export const metadata = { title: "일정 · LifeOS" };

type Params = Promise<{ id: string }>;

export default async function EventDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const event = await getEventById(id);
  if (!event) notFound();

  const meta = EVENT_CATEGORY_META[event.category];
  const deleteAction = deleteEvent.bind(null, event.id);

  return (
    <main className="flex flex-col gap-6 px-6 pt-10 pb-12">
      <header className="flex items-center justify-between">
        <Link
          href={`/calendar?date=${format(event.startDate, "yyyy-MM-dd")}`}
          className="text-foreground-muted"
        >
          ‹ 캘린더
        </Link>
        <Button asChild size="sm" variant="soft">
          <Link href={`/calendar/${event.id}/edit`}>수정</Link>
        </Button>
      </header>

      <Card>
        <div className="flex items-start gap-3">
          <span
            className={`flex h-12 w-12 items-center justify-center rounded-2xl text-xl ${meta.chipColor}`}
          >
            {meta.emoji}
          </span>
          <div className="flex flex-1 flex-col gap-1">
            <span className="text-[11px] text-foreground-muted">
              {meta.label}
            </span>
            <h2 className="text-lg font-bold leading-tight">{event.title}</h2>
          </div>
        </div>

        <dl className="mt-5 grid grid-cols-1 gap-3 text-sm">
          <Row label="날짜">
            {format(event.startDate, "yyyy년 M월 d일 (E)", { locale: ko })}
          </Row>
          <Row label="시간">
            {event.isAllDay
              ? "하루 종일"
              : `${format(event.startDate, "HH:mm")} - ${format(event.endDate, "HH:mm")}`}
          </Row>
          {event.description && <Row label="메모">{event.description}</Row>}
        </dl>
      </Card>

      <form action={deleteAction}>
        <Button
          type="submit"
          variant="ghost"
          size="sm"
          className="text-pink hover:bg-bg-pink"
        >
          🗑 일정 삭제
        </Button>
      </form>
    </main>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-foreground-muted">{label}</dt>
      <dd className="flex-1 text-right text-foreground">{children}</dd>
    </div>
  );
}
