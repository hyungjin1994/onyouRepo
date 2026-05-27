import "server-only";

import { cache } from "react";
import { startOfDay, startOfWeek, endOfWeek, subDays } from "date-fns";
import {
  AssignmentType,
  ChoreFrequency,
  type Chore,
  type ChoreLog,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth/dal";
import { getActivePartnership } from "@/lib/data/partnership";

export type ChoreWithTodayLog = Chore & {
  todayAssigneeId: string;
  todayLog: ChoreLog | null;
};

/**
 * Determine who is assigned a chore on a given date, based on assignment type.
 * Both partnership participants are required (otherwise return owner).
 */
export function computeAssignee(
  chore: Pick<Chore, "assignmentType" | "fixedAssigneeId" | "createdAt">,
  ownerId: string,
  partnerId: string,
  date: Date,
): string {
  switch (chore.assignmentType) {
    case AssignmentType.FIXED:
      return chore.fixedAssigneeId ?? ownerId;
    case AssignmentType.BY_DAY: {
      const dow = date.getDay();
      // weekdays go to owner, weekends to partner (overridable later via UI)
      return dow >= 1 && dow <= 5 ? ownerId : partnerId;
    }
    case AssignmentType.ROULETTE: {
      // deterministic pseudo-random per (chore, date) based on createdAt fingerprint
      const seed =
        date.getTime() / 86400000 + chore.createdAt.getTime() / 86400000;
      return Math.floor(seed) % 2 === 0 ? ownerId : partnerId;
    }
    case AssignmentType.ALTERNATE:
    default: {
      // Strict turn-taking using day index from chore creation.
      const day0 = startOfDay(chore.createdAt);
      const days = Math.floor(
        (startOfDay(date).getTime() - day0.getTime()) / 86400000,
      );
      return days % 2 === 0 ? ownerId : partnerId;
    }
  }
}

export const getChoresForToday = cache(
  async (now = new Date()): Promise<ChoreWithTodayLog[]> => {
    const partnership = await getActivePartnership();
    if (!partnership || !partnership.partnerId) return [];

    const today = startOfDay(now);
    const dow = today.getDay();

    const chores = await prisma.chore.findMany({
      where: { partnershipId: partnership.id },
      include: { logs: { where: { date: today }, take: 1 } },
      orderBy: { createdAt: "asc" },
    });

    return chores
      .filter((c) => {
        if (c.frequency === ChoreFrequency.DAILY) return true;
        if (c.frequency === ChoreFrequency.WEEKLY) {
          return c.daysOfWeek.length === 0 || c.daysOfWeek.includes(dow);
        }
        // MONTHLY / CUSTOM — show if scheduled today via daysOfWeek
        if (c.daysOfWeek.length > 0) return c.daysOfWeek.includes(dow);
        // For MONTHLY without daysOfWeek, show on the 1st only (lightweight rule).
        return c.frequency === ChoreFrequency.MONTHLY && today.getDate() === 1;
      })
      .map(({ logs, ...chore }) => {
        const assignee = computeAssignee(
          chore,
          partnership.ownerId,
          partnership.partnerId!,
          today,
        );
        return { ...chore, todayAssigneeId: assignee, todayLog: logs[0] ?? null };
      });
  },
);

/**
 * Per-chore breakdown of who completed how many over the last N days.
 * Useful for the fairness dashboard — shows which chores are owned by whom.
 */
export const getPerChoreFairness = cache(async (lookbackDays = 30) => {
  const partnership = await getActivePartnership();
  if (!partnership || !partnership.partnerId) return null;

  const since = subDays(startOfDay(new Date()), lookbackDays);

  const chores = await prisma.chore.findMany({
    where: { partnershipId: partnership.id },
    include: {
      logs: {
        where: { completedAt: { not: null, gte: since } },
        select: { completedById: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return chores.map((c) => {
    const ownerCount = c.logs.filter((l) => l.completedById === partnership.ownerId).length;
    const partnerCount = c.logs.filter(
      (l) => l.completedById === partnership.partnerId,
    ).length;
    return {
      id: c.id,
      title: c.title,
      emoji: c.emoji,
      ownerCount,
      partnerCount,
      total: ownerCount + partnerCount,
    };
  });
});

/**
 * Aggregated fairness stats over the last N days.
 */
export const getFairnessStats = cache(async (lookbackDays = 30) => {
  const session = await verifySession();
  const partnership = await getActivePartnership();
  if (!partnership || !partnership.partnerId) return null;

  const since = subDays(startOfDay(new Date()), lookbackDays);
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

  const [lookbackLogs, weekLogs] = await Promise.all([
    prisma.choreLog.findMany({
      where: {
        completedAt: { not: null, gte: since },
        chore: { partnershipId: partnership.id },
      },
      include: { chore: { select: { estimatedTime: true } } },
    }),
    prisma.choreLog.findMany({
      where: {
        completedAt: { not: null, gte: weekStart, lte: weekEnd },
        chore: { partnershipId: partnership.id },
      },
      include: { chore: { select: { estimatedTime: true } } },
    }),
  ]);

  const tally = (logs: typeof lookbackLogs, userId: string) =>
    logs.filter((l) => l.completedById === userId).length;

  const minutesBy = (logs: typeof lookbackLogs, userId: string) =>
    logs
      .filter((l) => l.completedById === userId)
      .reduce((sum, l) => sum + (l.chore.estimatedTime ?? 15), 0);

  const ownerWeek = tally(weekLogs, partnership.ownerId);
  const partnerWeek = tally(weekLogs, partnership.partnerId);
  const totalWeek = ownerWeek + partnerWeek || 1;

  const ownerLookback = tally(lookbackLogs, partnership.ownerId);
  const partnerLookback = tally(lookbackLogs, partnership.partnerId);
  const totalLookback = ownerLookback + partnerLookback || 1;

  return {
    currentUserId: session.userId,
    ownerId: partnership.ownerId,
    partnerId: partnership.partnerId,
    week: {
      owner: ownerWeek,
      partner: partnerWeek,
      ownerPct: Math.round((ownerWeek / totalWeek) * 100),
      partnerPct: Math.round((partnerWeek / totalWeek) * 100),
    },
    lookback: {
      owner: ownerLookback,
      partner: partnerLookback,
      ownerPct: Math.round((ownerLookback / totalLookback) * 100),
      partnerPct: Math.round((partnerLookback / totalLookback) * 100),
      lookbackDays,
    },
    minutes: {
      owner: minutesBy(lookbackLogs, partnership.ownerId),
      partner: minutesBy(lookbackLogs, partnership.partnerId),
    },
  };
});
