import "server-only";

import { cache } from "react";
import {
  endOfDay,
  endOfMonth,
  startOfDay,
  startOfMonth,
} from "date-fns";

import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth/dal";

export const getEventsForMonth = cache(async (year: number, month: number) => {
  const session = await verifySession();
  const monthStart = startOfMonth(new Date(year, month, 1));
  const monthEnd = endOfMonth(monthStart);

  return prisma.event.findMany({
    where: {
      userId: session.userId,
      startDate: { lte: monthEnd },
      endDate: { gte: monthStart },
    },
    orderBy: { startDate: "asc" },
  });
});

export const getEventsForDay = cache(async (date: Date) => {
  const session = await verifySession();
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);

  return prisma.event.findMany({
    where: {
      userId: session.userId,
      startDate: { lte: dayEnd },
      endDate: { gte: dayStart },
    },
    orderBy: { startDate: "asc" },
  });
});

export const getEventById = cache(async (id: string) => {
  const session = await verifySession();
  return prisma.event.findFirst({
    where: { id, userId: session.userId },
  });
});
