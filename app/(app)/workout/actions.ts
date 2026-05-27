"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { BodyPart, WorkoutType } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth/dal";

const StartWorkoutSchema = z.object({
  type: z.enum(WorkoutType),
  bodyPart: z.enum(BodyPart).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export async function startWorkout(input: {
  type: WorkoutType;
  bodyPart?: BodyPart | null;
}) {
  const session = await verifySession();

  const parsed = StartWorkoutSchema.safeParse(input);
  if (!parsed.success) return;

  const workout = await prisma.workout.create({
    data: {
      userId: session.userId,
      type: parsed.data.type,
      bodyPart: parsed.data.bodyPart ?? null,
      startedAt: new Date(),
    },
  });

  revalidatePath("/workout");
  redirect(`/workout/${workout.id}`);
}

export async function addExercise(
  workoutId: string,
  name: string,
  bodyPart: BodyPart | null,
) {
  const session = await verifySession();

  const workout = await prisma.workout.findFirst({
    where: { id: workoutId, userId: session.userId },
    select: { id: true },
  });
  if (!workout) return;

  await prisma.exercise.create({
    data: {
      workoutId,
      name,
      bodyPart,
      sets: {
        create: [{ setNumber: 1 }, { setNumber: 2 }, { setNumber: 3 }],
      },
    },
  });

  revalidatePath(`/workout/${workoutId}`);
}

const SetUpdateSchema = z.object({
  weight: z.preprocess(
    (v) => (v === "" || v === null ? null : Number(v)),
    z.number().nonnegative().nullable(),
  ),
  reps: z.preprocess(
    (v) => (v === "" || v === null ? null : Number(v)),
    z.number().int().nonnegative().nullable(),
  ),
});

export async function updateSet(
  setId: string,
  workoutId: string,
  raw: { weight: string; reps: string },
) {
  const session = await verifySession();
  await verifyWorkoutOwnership(workoutId, session.userId);

  const parsed = SetUpdateSchema.safeParse(raw);
  if (!parsed.success) return;

  await prisma.exerciseSet.update({
    where: { id: setId },
    data: {
      weight: parsed.data.weight,
      reps: parsed.data.reps,
    },
  });

  revalidatePath(`/workout/${workoutId}`);
}

export async function toggleSetComplete(setId: string, workoutId: string) {
  const session = await verifySession();
  await verifyWorkoutOwnership(workoutId, session.userId);

  const set = await prisma.exerciseSet.findUnique({
    where: { id: setId },
    select: { completed: true },
  });
  if (!set) return;

  await prisma.exerciseSet.update({
    where: { id: setId },
    data: { completed: !set.completed },
  });

  revalidatePath(`/workout/${workoutId}`);
}

export async function addSet(exerciseId: string, workoutId: string) {
  const session = await verifySession();
  await verifyWorkoutOwnership(workoutId, session.userId);

  const lastSet = await prisma.exerciseSet.findFirst({
    where: { exerciseId },
    orderBy: { setNumber: "desc" },
  });

  await prisma.exerciseSet.create({
    data: {
      exerciseId,
      setNumber: (lastSet?.setNumber ?? 0) + 1,
      weight: lastSet?.weight ?? null,
      reps: lastSet?.reps ?? null,
    },
  });

  revalidatePath(`/workout/${workoutId}`);
}

export async function removeExercise(exerciseId: string, workoutId: string) {
  const session = await verifySession();
  await verifyWorkoutOwnership(workoutId, session.userId);

  await prisma.exercise.delete({ where: { id: exerciseId } });
  revalidatePath(`/workout/${workoutId}`);
}

export async function finishWorkout(workoutId: string) {
  const session = await verifySession();
  const workout = await prisma.workout.findFirst({
    where: { id: workoutId, userId: session.userId },
  });
  if (!workout) return;

  const now = new Date();
  const durationMin = Math.max(
    1,
    Math.round((now.getTime() - workout.startedAt.getTime()) / 60000),
  );

  await prisma.workout.update({
    where: { id: workoutId },
    data: { endedAt: now, duration: durationMin },
  });

  revalidatePath("/workout");
  revalidatePath(`/workout/${workoutId}`);
  redirect("/workout");
}

export async function discardWorkout(workoutId: string) {
  const session = await verifySession();
  await prisma.workout.deleteMany({
    where: { id: workoutId, userId: session.userId },
  });
  revalidatePath("/workout");
  redirect("/workout");
}

async function verifyWorkoutOwnership(workoutId: string, userId: string) {
  const w = await prisma.workout.findFirst({
    where: { id: workoutId, userId },
    select: { id: true },
  });
  if (!w) throw new Error("workout not found");
}
