import { format } from "date-fns";

import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth/dal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Download all of the authenticated user's personal data as JSON.
 * Excluded for privacy/security: push subscriptions, raw auth credentials.
 * Shared (partnership) data is intentionally excluded — each member exports their own copy.
 */
export async function GET() {
  const session = await verifySession();

  const [user, events, routines, workouts, weightLogs, chatHistory] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: session.userId },
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          height: true,
          weight: true,
          assistantName: true,
          assistantTone: true,
          dndStart: true,
          dndEnd: true,
          timezone: true,
          createdAt: true,
        },
      }),
      prisma.event.findMany({
        where: { userId: session.userId },
        orderBy: { startDate: "asc" },
      }),
      prisma.routine.findMany({
        where: { userId: session.userId },
        include: {
          logs: { orderBy: { date: "desc" } },
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.workout.findMany({
        where: { userId: session.userId },
        include: {
          exercises: {
            include: { sets: { orderBy: { setNumber: "asc" } } },
            orderBy: { id: "asc" },
          },
        },
        orderBy: { startedAt: "desc" },
      }),
      prisma.weightLog.findMany({
        where: { userId: session.userId },
        orderBy: { date: "asc" },
      }),
      prisma.aIInteraction.findMany({
        where: { userId: session.userId },
        orderBy: { createdAt: "asc" },
      }),
    ]);

  const exported = {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    user,
    events,
    routines,
    workouts,
    weightLogs,
    chatHistory,
  };

  const filename = `lifeos-export-${format(new Date(), "yyyyMMdd-HHmm")}.json`;

  return new Response(JSON.stringify(exported, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
