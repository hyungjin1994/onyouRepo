import "server-only";

import { cache } from "react";
import { startOfDay, subDays, startOfWeek, endOfWeek } from "date-fns";
import { TimeOfDay } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth/dal";
import { TIME_OF_DAY_META } from "@/lib/routines";

/**
 * Activity heatmap — counts workouts + completed routine logs per (weekday × hour-of-day bucket)
 * over the last `lookbackDays` (default 60). Returns a 7×6 grid keyed by:
 *   day (0=Sun..6=Sat) × bucket (0:6h-9h, 1:9h-12h, 2:12h-15h, 3:15h-18h, 4:18h-21h, 5:21h-24h)
 */
export const getActivityHeatmap = cache(async (lookbackDays = 60) => {
  const session = await verifySession();
  const since = subDays(startOfDay(new Date()), lookbackDays);

  const [workouts, routineLogs] = await Promise.all([
    prisma.workout.findMany({
      where: { userId: session.userId, startedAt: { gte: since } },
      select: { startedAt: true },
    }),
    prisma.routineLog.findMany({
      where: {
        completed: true,
        completedAt: { not: null, gte: since },
        routine: { userId: session.userId },
      },
      select: { completedAt: true },
    }),
  ]);

  // grid[day][bucket]
  const grid: number[][] = Array.from({ length: 7 }, () => Array(6).fill(0));
  let maxValue = 0;

  const bump = (when: Date | null) => {
    if (!when) return;
    const day = when.getDay();
    const hour = when.getHours();
    if (hour < 6) return;
    const bucket = Math.min(5, Math.floor((hour - 6) / 3));
    grid[day][bucket]++;
    maxValue = Math.max(maxValue, grid[day][bucket]);
  };

  workouts.forEach((w) => bump(w.startedAt));
  routineLogs.forEach((r) => bump(r.completedAt));

  return { grid, maxValue, since };
});

export type DiscoveredPattern = {
  id: string;
  emoji: string;
  text: string;
};

/**
 * Lightweight rule-based pattern miner (§7.5.2). Findings include:
 *   - Most active weekday for workouts
 *   - Best-completed routine slot of day
 *   - Whether workout-on-weekend correlates with weekend routine completion
 *
 * Pure data — no AI calls. Returns at most 4 findings; if data is too thin we return [].
 */
export const getDiscoveredPatterns = cache(
  async (): Promise<DiscoveredPattern[]> => {
    const session = await verifySession();
    const since = subDays(startOfDay(new Date()), 60);

    const [workouts, routineLogs, weights] = await Promise.all([
      prisma.workout.findMany({
        where: { userId: session.userId, startedAt: { gte: since } },
        select: { startedAt: true },
      }),
      prisma.routineLog.findMany({
        where: {
          completed: true,
          completedAt: { not: null, gte: since },
          routine: { userId: session.userId },
        },
        select: { completedAt: true, routine: { select: { timeOfDay: true } } },
      }),
      prisma.weightLog.findMany({
        where: { userId: session.userId, date: { gte: since } },
        select: { weight: true, date: true },
        orderBy: { date: "asc" },
      }),
    ]);

    const findings: DiscoveredPattern[] = [];

    // --- Most active workout weekday ---
    if (workouts.length >= 5) {
      const byDow = new Array<number>(7).fill(0);
      for (const w of workouts) byDow[w.startedAt.getDay()] += 1;
      const peak = byDow.indexOf(Math.max(...byDow));
      const labels = ["일", "월", "화", "수", "목", "금", "토"];
      findings.push({
        id: "workout-peak-day",
        emoji: "💪",
        text: `최근 60일 가장 자주 운동한 요일: ${labels[peak]}요일 (${byDow[peak]}회)`,
      });
    }

    // --- Best routine-completion time of day ---
    if (routineLogs.length >= 10) {
      const bySlot: Record<TimeOfDay, number> = {
        MORNING: 0,
        AFTERNOON: 0,
        EVENING: 0,
        NIGHT: 0,
        CUSTOM: 0,
      };
      for (const log of routineLogs) {
        bySlot[log.routine.timeOfDay] += 1;
      }
      const ordered = (Object.entries(bySlot) as [TimeOfDay, number][])
        .filter(([slot]) => slot !== "CUSTOM")
        .sort((a, b) => b[1] - a[1]);
      const best = ordered[0];
      if (best && best[1] > 0) {
        findings.push({
          id: "routine-best-slot",
          emoji: TIME_OF_DAY_META[best[0]].emoji,
          text: `${TIME_OF_DAY_META[best[0]].label} 루틴을 가장 잘 챙기고 있어요 (${best[1]}회 완료)`,
        });
      }
    }

    // --- Workout / routine streak correlation ---
    // For each ISO-week in window, compare # of workouts vs routine completion rate.
    if (workouts.length >= 4 && routineLogs.length >= 8) {
      const buckets = new Map<string, { workouts: number; routines: number }>();
      for (const w of workouts) {
        const key = startOfWeek(w.startedAt, { weekStartsOn: 1 }).toISOString();
        const bucket = buckets.get(key) ?? { workouts: 0, routines: 0 };
        bucket.workouts += 1;
        buckets.set(key, bucket);
      }
      for (const log of routineLogs) {
        if (!log.completedAt) continue;
        const key = startOfWeek(log.completedAt, { weekStartsOn: 1 }).toISOString();
        const bucket = buckets.get(key) ?? { workouts: 0, routines: 0 };
        bucket.routines += 1;
        buckets.set(key, bucket);
      }
      const weeks = Array.from(buckets.values());
      const heavy = weeks.filter((w) => w.workouts >= 2);
      const light = weeks.filter((w) => w.workouts < 2);
      if (heavy.length >= 2 && light.length >= 2) {
        const heavyAvg = avg(heavy.map((w) => w.routines));
        const lightAvg = avg(light.map((w) => w.routines));
        if (heavyAvg - lightAvg >= 2) {
          findings.push({
            id: "workout-routine-correlation",
            emoji: "🔗",
            text: `운동 많이 한 주에 루틴도 더 챙기는 경향이 있어요 (평균 ${heavyAvg.toFixed(0)} vs ${lightAvg.toFixed(0)})`,
          });
        }
      }
    }

    // --- Weight trend ---
    if (weights.length >= 4) {
      const first = weights[0].weight;
      const last = weights[weights.length - 1].weight;
      const delta = last - first;
      if (Math.abs(delta) >= 1) {
        findings.push({
          id: "weight-trend",
          emoji: delta < 0 ? "📉" : "📈",
          text: `최근 60일 몸무게가 ${delta > 0 ? "▲" : "▼"}${Math.abs(delta).toFixed(1)}kg 변화했어요`,
        });
      }
    }

    return findings.slice(0, 4);
  },
);

function avg(xs: number[]): number {
  return xs.reduce((s, n) => s + n, 0) / Math.max(1, xs.length);
}

/**
 * Weekly summary across all data domains. Cheap aggregate queries — no AI involved.
 */
export const getWeeklyReport = cache(async (now = new Date()) => {
  const session = await verifySession();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const [workoutCount, routineLogs, routineTotal, weights, latestSleep] =
    await Promise.all([
      prisma.workout.count({
        where: {
          userId: session.userId,
          startedAt: { gte: weekStart, lte: weekEnd },
        },
      }),
      prisma.routineLog.findMany({
        where: {
          completed: true,
          date: { gte: weekStart, lte: weekEnd },
          routine: { userId: session.userId },
        },
        select: { id: true },
      }),
      prisma.routine.count({ where: { userId: session.userId } }),
      prisma.weightLog.findMany({
        where: {
          userId: session.userId,
          date: { gte: weekStart, lte: weekEnd },
        },
        orderBy: { date: "asc" },
        select: { weight: true, date: true },
      }),
      prisma.weightLog.findMany({
        where: { userId: session.userId },
        orderBy: { date: "desc" },
        take: 1,
      }),
    ]);

  const possibleRoutineSlots = routineTotal * 7;
  const routineRate = possibleRoutineSlots
    ? Math.round((routineLogs.length / possibleRoutineSlots) * 100)
    : 0;

  const weightDelta =
    weights.length >= 2
      ? weights[weights.length - 1].weight - weights[0].weight
      : null;

  return {
    weekStart,
    weekEnd,
    workoutCount,
    routineDone: routineLogs.length,
    routineTotal: possibleRoutineSlots,
    routineRate,
    weightDelta,
    latestWeight: latestSleep[0]?.weight ?? null,
  };
});
