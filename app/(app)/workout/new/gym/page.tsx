import Link from "next/link";

import { BODY_PART_OPTIONS } from "@/lib/workout-catalog";
import { WorkoutType } from "@prisma/client";
import { StartTypeButton } from "../_components/start-type-button";

export const metadata = { title: "헬스 부위 선택 · LifeOS" };

export default function GymBodyPartPage() {
  return (
    <main className="flex flex-col gap-6 px-6 pt-10 pb-12">
      <header className="flex items-center gap-3">
        <Link href="/workout/new" className="text-foreground-muted">
          ‹
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">어디를 단련할까요?</h1>
      </header>

      <ul className="grid grid-cols-2 gap-3">
        {BODY_PART_OPTIONS.map((opt) => (
          <li key={opt.value}>
            <StartTypeButton
              type={WorkoutType.GYM}
              bodyPart={opt.value}
              emoji={opt.emoji}
              label={opt.label}
              description="세트별 무게 × 횟수"
            />
          </li>
        ))}
      </ul>
    </main>
  );
}
