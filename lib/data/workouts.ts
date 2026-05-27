import "server-only";

import { cache } from "react";
import { startOfWeek, endOfWeek, subDays, startOfDay } from "date-fns";
import { BodyPart, WorkoutType } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth/dal";

export const getRecentWorkouts = cache(async (limit = 10) => {
  const session = await verifySession();
  return prisma.workout.findMany({
    where: { userId: session.userId },
    orderBy: { startedAt: "desc" },
    take: limit,
    include: {
      exercises: { include: { sets: true } },
    },
  });
});

export const getWorkoutById = cache(async (id: string) => {
  const session = await verifySession();
  return prisma.workout.findFirst({
    where: { id, userId: session.userId },
    include: {
      exercises: {
        include: { sets: { orderBy: { setNumber: "asc" } } },
        orderBy: { id: "asc" },
      },
    },
  });
});

/**
 * Last 30d counts per body part (gym workouts only). Missing parts default to 0.
 */
export const getBodyPartCounts = cache(
  async (lookbackDays = 30): Promise<Record<BodyPart, number>> => {
    const session = await verifySession();
    const since = subDays(startOfDay(new Date()), lookbackDays);

    const rows = await prisma.workout.findMany({
      where: {
        userId: session.userId,
        type: WorkoutType.GYM,
        bodyPart: { not: null },
        startedAt: { gte: since },
      },
      select: { bodyPart: true },
    });

    const counts: Record<BodyPart, number> = {
      [BodyPart.CHEST]: 0,
      [BodyPart.BACK]: 0,
      [BodyPart.LEGS]: 0,
      [BodyPart.SHOULDERS]: 0,
      [BodyPart.ARMS]: 0,
      [BodyPart.ABS]: 0,
    };
    for (const r of rows) {
      if (r.bodyPart) counts[r.bodyPart] += 1;
    }
    return counts;
  },
);

export const getWeeklyWorkoutStats = cache(async (now = new Date()) => {
  const session = await verifySession();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const workouts = await prisma.workout.findMany({
    where: {
      userId: session.userId,
      startedAt: { gte: weekStart, lte: weekEnd },
    },
    include: { exercises: { include: { sets: true } } },
  });

  const totalMinutes = workouts.reduce(
    (sum, w) => sum + (w.duration ?? 0),
    0,
  );
  const totalVolume = workouts.reduce((sum, w) => {
    return (
      sum +
      w.exercises.reduce((es, e) => {
        return (
          es +
          e.sets.reduce(
            (ss, s) =>
              ss + (s.completed ? (s.weight ?? 0) * (s.reps ?? 0) : 0),
            0,
          )
        );
      }, 0)
    );
  }, 0);

  return {
    count: workouts.length,
    totalMinutes,
    totalVolume,
  };
});
