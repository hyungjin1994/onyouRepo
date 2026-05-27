import "server-only";

import { startOfDay, parseISO } from "date-fns";

import { prisma } from "@/lib/prisma";
import type {
  CreateEventInput,
  LogWeightInput,
  LogWorkoutInput,
  MarkRoutineDoneInput,
} from "./tools";

export type ToolResultPayload =
  | { ok: true; message: string; data?: Record<string, unknown> }
  | { ok: false; message: string };

export async function executeLogWorkout(
  userId: string,
  input: LogWorkoutInput,
): Promise<ToolResultPayload> {
  const workout = await prisma.workout.create({
    data: {
      userId,
      type: input.type,
      bodyPart: input.body_part ?? null,
      startedAt: new Date(),
      endedAt: new Date(),
      duration: null,
      notes: input.notes ?? null,
      exercises: {
        create: input.exercises.map((ex) => ({
          name: ex.name,
          bodyPart: input.body_part ?? null,
          sets: {
            create: ex.sets.map((s, i) => ({
              setNumber: i + 1,
              weight: s.weight ?? null,
              reps: s.reps,
              completed: true,
            })),
          },
        })),
      },
    },
  });

  const totalSets = input.exercises.reduce((n, e) => n + e.sets.length, 0);
  return {
    ok: true,
    message: `운동 기록 완료 (${input.exercises.length}종목, ${totalSets}세트)`,
    data: { workoutId: workout.id },
  };
}

export async function executeMarkRoutineDone(
  userId: string,
  input: MarkRoutineDoneInput,
): Promise<ToolResultPayload> {
  const routines = await prisma.routine.findMany({
    where: { userId },
    select: { id: true, title: true },
  });

  if (routines.length === 0) {
    return { ok: false, message: "등록된 루틴이 없어요." };
  }

  const target =
    routines.find((r) => r.title === input.routine_title) ??
    routines.find((r) =>
      r.title.toLowerCase().includes(input.routine_title.toLowerCase()),
    ) ??
    routines.find((r) =>
      input.routine_title.toLowerCase().includes(r.title.toLowerCase()),
    );

  if (!target) {
    return {
      ok: false,
      message: `'${input.routine_title}' 루틴을 찾지 못했어요.`,
    };
  }

  const today = startOfDay(new Date());
  await prisma.routineLog.upsert({
    where: { routineId_date: { routineId: target.id, date: today } },
    update: { completed: true, completedAt: new Date() },
    create: {
      routineId: target.id,
      date: today,
      completed: true,
      completedAt: new Date(),
    },
  });

  return { ok: true, message: `'${target.title}' 완료 처리했어요.` };
}

export async function executeLogWeight(
  userId: string,
  input: LogWeightInput,
): Promise<ToolResultPayload> {
  const today = startOfDay(new Date());
  await prisma.weightLog.upsert({
    where: { userId_date: { userId, date: today } },
    update: {
      weight: input.weight,
      bodyFat: input.body_fat ?? null,
      muscleMass: input.muscle_mass ?? null,
      note: input.note ?? null,
    },
    create: {
      userId,
      date: today,
      weight: input.weight,
      bodyFat: input.body_fat ?? null,
      muscleMass: input.muscle_mass ?? null,
      note: input.note ?? null,
    },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { weight: input.weight },
  });

  return { ok: true, message: `${input.weight}kg 기록했어요.` };
}

export async function executeCreateEvent(
  userId: string,
  input: CreateEventInput,
): Promise<ToolResultPayload> {
  const [year, month, day] = input.date.split("-").map(Number);
  const baseDate = new Date(year, month - 1, day);

  let startDate: Date;
  let endDate: Date;

  if (input.is_all_day || (!input.start_time && !input.end_time)) {
    startDate = baseDate;
    endDate = new Date(baseDate);
    endDate.setHours(23, 59, 59, 0);
  } else {
    const [sh, sm] = (input.start_time ?? "09:00").split(":").map(Number);
    const [eh, em] = (input.end_time ?? input.start_time ?? "10:00")
      .split(":")
      .map(Number);
    startDate = new Date(year, month - 1, day, sh, sm);
    endDate = new Date(year, month - 1, day, eh, em);
    if (endDate <= startDate) endDate = new Date(startDate.getTime() + 3600_000);
  }

  const event = await prisma.event.create({
    data: {
      userId,
      title: input.title,
      category: input.category,
      isAllDay: !!input.is_all_day,
      startDate,
      endDate,
    },
  });

  return {
    ok: true,
    message: `'${input.title}' 일정을 ${input.date}에 추가했어요.`,
    data: { eventId: event.id },
  };
}
