import "server-only";

import { cache } from "react";
import { startOfDay, subDays } from "date-fns";
import { type Routine, type RoutineLog } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth/dal";

export type RoutineWithTodayLog = Routine & { todayLog: RoutineLog | null };

export const getRoutinesForToday = cache(
  async (now = new Date()): Promise<RoutineWithTodayLog[]> => {
    const session = await verifySession();
    const today = startOfDay(now);
    const dayOfWeek = today.getDay(); // 0 = Sun

    const routines = await prisma.routine.findMany({
      where: { userId: session.userId },
      include: {
        logs: { where: { date: today }, take: 1 },
      },
      orderBy: { createdAt: "asc" },
    });

    return routines
      .filter(
        (r) => r.daysOfWeek.length === 0 || r.daysOfWeek.includes(dayOfWeek),
      )
      .map(({ logs, ...routine }) => ({
        ...routine,
        todayLog: logs[0] ?? null,
      }));
  },
);

/**
 * Consecutive days (ending yesterday or today) the routine has been marked completed.
 * Today counts if already checked; otherwise we look back from yesterday so the
 * streak doesn't drop to zero just because today isn't done yet.
 */
export async function getRoutineStreak(routineId: string): Promise<number> {
  const logs = await prisma.routineLog.findMany({
    where: { routineId, completed: true },
    orderBy: { date: "desc" },
    take: 365,
    select: { date: true },
  });

  if (logs.length === 0) return 0;

  const today = startOfDay(new Date());
  const completedDays = new Set(
    logs.map((l) => startOfDay(l.date).toISOString()),
  );

  let streak = 0;
  let cursor = completedDays.has(today.toISOString()) ? today : subDays(today, 1);

  while (completedDays.has(cursor.toISOString())) {
    streak++;
    cursor = subDays(cursor, 1);
  }
  return streak;
}

