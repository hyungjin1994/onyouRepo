import Link from "next/link";
import { notFound } from "next/navigation";
import { BodyPart } from "@prisma/client";

import { getWorkoutById } from "@/lib/data/workouts";
import {
  BODY_PART_META,
  BODY_PART_OPTIONS,
  EXERCISES_BY_PART,
} from "@/lib/workout-catalog";
import { ExercisePicker } from "./_components/exercise-picker";

export const metadata = { title: "종목 추가 · LifeOS" };

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{ part?: string }>;

export default async function AddExercisePage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const { part } = await searchParams;

  const workout = await getWorkoutById(id);
  if (!workout) notFound();

  // For GYM workouts, default to the workout's chosen body part unless overridden via ?part=
  const activePart: BodyPart | null =
    part && part in BODY_PART_META
      ? (part as BodyPart)
      : (workout.bodyPart ?? null);

  const catalog = activePart ? EXERCISES_BY_PART[activePart] : [];

  return (
    <main className="flex flex-col gap-5 px-6 pt-10 pb-12">
      <header className="flex items-center gap-3">
        <Link href={`/workout/${workout.id}`} className="text-foreground-muted">
          ‹
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">종목 추가</h1>
      </header>

      {/* Body part picker — visible for all types so user can switch focus mid-session */}
      <div className="flex gap-2 overflow-x-auto">
        {BODY_PART_OPTIONS.map((opt) => {
          const active = opt.value === activePart;
          return (
            <Link
              key={opt.value}
              href={`/workout/${workout.id}/add-exercise?part=${opt.value}`}
              className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs transition-colors ${
                active
                  ? "border-lavender bg-lavender text-white"
                  : "border-border bg-surface text-foreground-muted"
              }`}
            >
              {opt.emoji} {opt.label}
            </Link>
          );
        })}
      </div>

      <ExercisePicker
        workoutId={workout.id}
        bodyPart={activePart}
        catalog={catalog}
      />
    </main>
  );
}
