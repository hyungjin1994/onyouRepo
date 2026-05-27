import Link from "next/link";

import { WorkoutType } from "@prisma/client";
import { WORKOUT_TYPE_OPTIONS } from "@/lib/workout-catalog";
import { StartTypeButton } from "./_components/start-type-button";

export const metadata = { title: "운동 시작 · LifeOS" };

export default function NewWorkoutPage() {
  return (
    <main className="flex flex-col gap-6 px-6 pt-10 pb-12">
      <header className="flex items-center gap-3">
        <Link href="/workout" className="text-foreground-muted">
          ‹
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">어떤 운동을 할까요?</h1>
      </header>

      <ul className="grid grid-cols-2 gap-3">
        {WORKOUT_TYPE_OPTIONS.map((opt) => {
          // GYM goes through body-part selection; others start the workout directly.
          if (opt.value === WorkoutType.GYM) {
            return (
              <li key={opt.value}>
                <Link
                  href="/workout/new/gym"
                  className="flex h-full flex-col items-center justify-center gap-2 rounded-card bg-surface py-6 shadow-card hover:bg-bg-lavender/30"
                >
                  <span className="text-3xl">{opt.emoji}</span>
                  <span className="text-sm font-medium">{opt.label}</span>
                  <span className="text-[10px] text-foreground-weak">
                    {opt.description}
                  </span>
                </Link>
              </li>
            );
          }
          return (
            <li key={opt.value}>
              <StartTypeButton type={opt.value} {...opt} />
            </li>
          );
        })}
      </ul>
    </main>
  );
}
