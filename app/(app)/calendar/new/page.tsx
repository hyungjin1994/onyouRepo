import Link from "next/link";
import { format } from "date-fns";

import { createEvent } from "../actions";
import { EventForm } from "../_components/event-form";

export const metadata = { title: "일정 추가 · LifeOS" };

type SearchParams = Promise<{ date?: string }>;

export default async function NewEventPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const defaultDate = params.date ?? format(new Date(), "yyyy-MM-dd");

  return (
    <main className="flex flex-col gap-6 px-6 pt-10 pb-12">
      <header className="flex items-center gap-3">
        <Link href="/calendar" className="text-foreground-muted">
          ‹
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">일정 추가</h1>
      </header>

      <EventForm
        action={createEvent}
        defaults={{
          date: defaultDate,
          startTime: "09:00",
          endTime: "10:00",
        }}
        submitLabel="저장하기"
      />
    </main>
  );
}
