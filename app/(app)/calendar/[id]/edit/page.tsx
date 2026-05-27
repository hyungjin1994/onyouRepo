import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";

import { getEventById } from "@/lib/data/events";
import { updateEvent } from "../../actions";
import { EventForm } from "../../_components/event-form";

export const metadata = { title: "일정 수정 · LifeOS" };

type Params = Promise<{ id: string }>;

export default async function EditEventPage({ params }: { params: Params }) {
  const { id } = await params;
  const event = await getEventById(id);
  if (!event) notFound();

  const action = updateEvent.bind(null, event.id);

  return (
    <main className="flex flex-col gap-6 px-6 pt-10 pb-12">
      <header className="flex items-center gap-3">
        <Link href={`/calendar/${event.id}`} className="text-foreground-muted">
          ‹
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">일정 수정</h1>
      </header>

      <EventForm
        action={action}
        defaults={{
          title: event.title,
          description: event.description,
          date: format(event.startDate, "yyyy-MM-dd"),
          startTime: format(event.startDate, "HH:mm"),
          endTime: format(event.endDate, "HH:mm"),
          isAllDay: event.isAllDay,
          category: event.category,
        }}
        submitLabel="수정하기"
      />
    </main>
  );
}
