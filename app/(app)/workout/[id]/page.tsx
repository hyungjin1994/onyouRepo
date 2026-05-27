import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

import { Card } from "@/components/ui/card";
import { getWorkoutById } from "@/lib/data/workouts";
import { BODY_PART_META, WORKOUT_TYPE_META } from "@/lib/workout-catalog";
import { SetRow } from "./_components/set-row";
import {
  AddSetButton,
  RemoveExerciseButton,
} from "./_components/exercise-controls";
import { WorkoutEndControls } from "./_components/workout-end";

export const metadata = { title: "운동 세션 · LifeOS" };

type Params = Promise<{ id: string }>;

export default async function WorkoutSessionPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const workout = await getWorkoutById(id);
  if (!workout) notFound();

  const typeMeta = WORKOUT_TYPE_META[workout.type];
  const partMeta = workout.bodyPart ? BODY_PART_META[workout.bodyPart] : null;
  const isActive = !workout.endedAt;

  const totalVolume = workout.exercises.reduce(
    (sum, e) =>
      sum +
      e.sets.reduce(
        (s, set) =>
          s + (set.completed ? (set.weight ?? 0) * (set.reps ?? 0) : 0),
        0,
      ),
    0,
  );

  return (
    <main className="flex flex-col gap-6 px-6 pt-10 pb-12">
      <header className="flex items-center justify-between">
        <Link href="/workout" className="text-foreground-muted">
          ‹ 운동
        </Link>
        <span className="text-xs text-foreground-muted">
          {format(workout.startedAt, "M월 d일 (E) HH:mm", { locale: ko })}
        </span>
      </header>

      <Card className="bg-bg-lavender">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface text-2xl">
            {typeMeta.emoji}
          </span>
          <div className="flex flex-1 flex-col">
            <h1 className="text-lg font-bold">{typeMeta.label}</h1>
            {partMeta && (
              <span className="text-xs text-foreground-muted">
                {partMeta.emoji} {partMeta.label}
              </span>
            )}
          </div>
          {totalVolume > 0 && (
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-foreground-muted">볼륨</span>
              <span className="text-sm font-bold">
                {totalVolume.toFixed(0)}kg
              </span>
            </div>
          )}
        </div>
      </Card>

      <section className="flex flex-col gap-3">
        {workout.exercises.length === 0 ? (
          <Card className="text-center text-sm text-foreground-muted">
            아직 종목이 없어요.
            <br />
            아래에서 첫 종목을 추가해주세요.
          </Card>
        ) : (
          workout.exercises.map((exercise) => (
            <Card key={exercise.id}>
              <div className="flex items-baseline justify-between">
                <h3 className="text-sm font-medium">{exercise.name}</h3>
                {isActive && (
                  <RemoveExerciseButton
                    exerciseId={exercise.id}
                    workoutId={workout.id}
                  />
                )}
              </div>

              <div className="mt-3 grid grid-cols-[28px_1fr_1fr_44px] gap-2 text-[10px] text-foreground-weak">
                <span className="text-center">#</span>
                <span className="text-center">kg</span>
                <span className="text-center">횟수</span>
                <span className="text-center">완료</span>
              </div>

              <div className="mt-1 flex flex-col">
                {exercise.sets.map((set) => (
                  <SetRow
                    key={set.id}
                    setId={set.id}
                    workoutId={workout.id}
                    setNumber={set.setNumber}
                    initialWeight={set.weight}
                    initialReps={set.reps}
                    initialCompleted={set.completed}
                  />
                ))}
              </div>

              {isActive && (
                <div className="mt-2">
                  <AddSetButton
                    exerciseId={exercise.id}
                    workoutId={workout.id}
                  />
                </div>
              )}
            </Card>
          ))
        )}
      </section>

      {isActive && (
        <>
          <Link
            href={`/workout/${workout.id}/add-exercise`}
            className="rounded-2xl bg-bg-lavender py-3 text-center text-sm font-medium text-foreground"
          >
            + 종목 추가
          </Link>

          <WorkoutEndControls workoutId={workout.id} />
        </>
      )}
    </main>
  );
}
