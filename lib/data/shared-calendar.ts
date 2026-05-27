import "server-only";

import { cache } from "react";

import { prisma } from "@/lib/prisma";
import { getActivePartnership } from "@/lib/data/partnership";

export type CalendarEntry = {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  isAllDay: boolean;
  source: "SHARED" | "OWNER_PERSONAL" | "PARTNER_PERSONAL";
  ownerId: string;
  conflictsWith: string[];   // ids of other entries overlapping in time
};

/**
 * Combined view of:
 *  - shared events (always shown with full detail)
 *  - both partners' personal events (shown so we can flag time conflicts)
 *
 * Conflict detection is range-based and ignores all-day events
 * (an all-day "휴가" doesn't conflict with a 14:00 meeting).
 */
export const getMergedUpcomingCalendar = cache(async () => {
  const partnership = await getActivePartnership();
  if (!partnership || !partnership.partnerId) return null;

  const now = new Date();
  const horizon = new Date(now);
  horizon.setDate(horizon.getDate() + 60); // look 60 days ahead

  const [shared, ownerPersonal, partnerPersonal] = await Promise.all([
    prisma.sharedEvent.findMany({
      where: {
        partnershipId: partnership.id,
        endDate: { gte: now },
        startDate: { lte: horizon },
      },
      orderBy: { startDate: "asc" },
    }),
    prisma.event.findMany({
      where: {
        userId: partnership.ownerId,
        endDate: { gte: now },
        startDate: { lte: horizon },
      },
      orderBy: { startDate: "asc" },
    }),
    prisma.event.findMany({
      where: {
        userId: partnership.partnerId,
        endDate: { gte: now },
        startDate: { lte: horizon },
      },
      orderBy: { startDate: "asc" },
    }),
  ]);

  const merged: CalendarEntry[] = [
    ...shared.map((e) => ({
      id: `s:${e.id}`,
      title: e.title,
      startDate: e.startDate,
      endDate: e.endDate,
      isAllDay: e.isAllDay,
      source: "SHARED" as const,
      ownerId: partnership.id,
      conflictsWith: [] as string[],
    })),
    ...ownerPersonal.map((e) => ({
      id: `o:${e.id}`,
      title: e.title,
      startDate: e.startDate,
      endDate: e.endDate,
      isAllDay: e.isAllDay,
      source: "OWNER_PERSONAL" as const,
      ownerId: partnership.ownerId,
      conflictsWith: [] as string[],
    })),
    ...partnerPersonal.map((e) => ({
      id: `p:${e.id}`,
      title: e.title,
      startDate: e.startDate,
      endDate: e.endDate,
      isAllDay: e.isAllDay,
      source: "PARTNER_PERSONAL" as const,
      ownerId: partnership.partnerId!,
      conflictsWith: [] as string[],
    })),
  ];

  // O(n²) is fine for ≤ a few hundred entries on a 2-month window.
  // We only flag conflicts between *different people* — overlapping with yourself
  // is a personal-calendar problem, not something to nudge a partner about.
  for (let i = 0; i < merged.length; i += 1) {
    for (let j = i + 1; j < merged.length; j += 1) {
      const a = merged[i];
      const b = merged[j];
      if (a.isAllDay || b.isAllDay) continue;
      if (a.ownerId === b.ownerId) continue;
      if (a.startDate < b.endDate && b.startDate < a.endDate) {
        a.conflictsWith.push(b.id);
        b.conflictsWith.push(a.id);
      }
    }
  }

  return {
    entries: merged.sort((a, b) => a.startDate.getTime() - b.startDate.getTime()),
    ownerId: partnership.ownerId,
    partnerId: partnership.partnerId,
  };
});
