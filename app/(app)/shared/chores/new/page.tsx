import Link from "next/link";

import { CHORE_PRESETS } from "@/lib/chores";
import { NewChoreForm } from "./new-chore-form";

export const metadata = { title: "가사 추가 · LifeOS" };

export default function NewChorePage() {
  return (
    <main className="flex flex-col gap-6 px-6 pt-10 pb-12">
      <header className="flex items-center gap-3">
        <Link href="/shared/chores" className="text-foreground-muted">
          ‹
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">가사 추가</h1>
      </header>

      <NewChoreForm presets={CHORE_PRESETS} />
    </main>
  );
}
