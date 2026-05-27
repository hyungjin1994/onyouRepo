import Link from "next/link";

import { NewRoutineForm } from "./new-routine-form";

export const metadata = { title: "루틴 추가 · LifeOS" };

export default function NewRoutinePage() {
  return (
    <main className="flex flex-col gap-6 px-6 pt-10 pb-12">
      <header className="flex items-center gap-3">
        <Link href="/routines" className="text-foreground-muted">
          ‹
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">루틴 추가</h1>
      </header>

      <NewRoutineForm />
    </main>
  );
}
