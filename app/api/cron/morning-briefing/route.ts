import { NextResponse } from "next/server";
import { startOfDay } from "date-fns";

import { prisma } from "@/lib/prisma";
import { sendPushToUser } from "@/lib/push/send";
import { isAuthorizedCron } from "@/lib/push/authorize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 매일 아침 7시 (Asia/Seoul) — 오늘 일정/루틴 요약을 보내준다.
// vercel.json에서 매시간 트리거하고, 사용자 timezone에 따라 7시일 때만 발송.
export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    where: { pushEnabled: true },
    select: { id: true, assistantName: true, timezone: true },
  });

  const now = new Date();
  const dayStart = startOfDay(now);
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

  let sent = 0;

  for (const user of users) {
    if (!isLocalHour(now, user.timezone, 7)) continue;

    const [eventCount, routineCount] = await Promise.all([
      prisma.event.count({
        where: { userId: user.id, startDate: { gte: dayStart, lt: dayEnd } },
      }),
      prisma.routine.count({
        where: {
          userId: user.id,
          OR: [
            { daysOfWeek: { isEmpty: true } },
            { daysOfWeek: { has: now.getDay() } },
          ],
        },
      }),
    ]);

    const lines: string[] = [];
    if (eventCount) lines.push(`📅 일정 ${eventCount}개`);
    if (routineCount) lines.push(`✓ 루틴 ${routineCount}개`);
    const body = lines.length ? lines.join(" · ") : "오늘은 일정이 없네요. 푹 쉬어가요.";

    const result = await sendPushToUser(
      user.id,
      {
        title: `좋은 아침이에요 ☀️`,
        body,
        url: "/home",
        tag: `morning-${dayStart.toISOString().slice(0, 10)}`,
      },
      { logType: "NOTIFICATION" },
    );

    if (result.sent > 0) sent += 1;
  }

  return NextResponse.json({ ok: true, targeted: users.length, sent });
}

function isLocalHour(now: Date, timezone: string, hour: number): boolean {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    hour12: false,
  });
  const local = Number(fmt.format(now));
  return local === hour;
}
