import Link from "next/link";

import { NewGoalForm } from "./new-goal-form";

export const metadata = { title: "함께 목표 추가 · LifeOS" };

export default function NewGoalPage() {
  return (
    <main className="flex flex-col gap-6 px-6 pt-10 pb-12">
      <header className="flex items-center gap-3">
        <Link href="/shared/goals" className="text-foreground-muted">
          ‹
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">함께 목표 추가</h1>
      </header>

      <NewGoalForm />
    </main>
  );
}
