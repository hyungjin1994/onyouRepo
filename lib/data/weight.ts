import "server-only";

import { cache } from "react";
import { subDays, subMonths, subYears, startOfDay } from "date-fns";

import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth/dal";

export type WeightRange = "1w" | "1m" | "3m" | "1y" | "all";

const RANGE_START: Record<Exclude<WeightRange, "all">, (now: Date) => Date> = {
  "1w": (now) => subDays(now, 7),
  "1m": (now) => subMonths(now, 1),
  "3m": (now) => subMonths(now, 3),
  "1y": (now) => subYears(now, 1),
};

export const getWeightLogs = cache(async (range: WeightRange = "3m") => {
  const session = await verifySession();
  const now = startOfDay(new Date());

  return prisma.weightLog.findMany({
    where: {
      userId: session.userId,
      ...(range !== "all" && { date: { gte: RANGE_START[range](now) } }),
    },
    orderBy: { date: "asc" },
  });
});
