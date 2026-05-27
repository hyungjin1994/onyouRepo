import Link from "next/link";
import { format } from "date-fns";

import { SharedEventForm } from "./shared-event-form";

export const metadata = { title: "공동 일정 추가 · LifeOS" };

export default function NewSharedEventPage() {
  const today = format(new Date(), "yyyy-MM-dd");
  return (
    <main className="flex flex-col gap-6 px-6 pt-10 pb-12">
      <header className="flex items-center gap-3">
        <Link href="/shared/calendar" className="text-foreground-muted">
          ‹
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">공동 일정 추가</h1>
      </header>

      <SharedEventForm defaultDate={today} />
    </main>
  );
}
