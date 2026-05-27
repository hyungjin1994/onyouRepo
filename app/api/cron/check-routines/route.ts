import { NextResponse } from "next/server";
import { startOfDay } from "date-fns";

import { prisma } from "@/lib/prisma";
import { sendPushToUser } from "@/lib/push/send";
import { isAuthorizedCron } from "@/lib/push/authorize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 시간대별 루틴 리마인더. 매시간 호출돼서 해당 시간대에 진입한 사용자에게만 알림.
// MORNING(7시) / AFTERNOON(12시) / EVENING(18시) / NIGHT(22시) 기준.
const TIME_OF_DAY_HOURS: Record<string, number> = {
  MORNING: 7,
  AFTERNOON: 12,
  EVENING: 18,
  NIGHT: 22,
};

export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    where: { pushEnabled: true },
    select: { id: true, timezone: true, assistantName: true },
  });

  const now = new Date();
  const today = startOfDay(now);
  const dayOfWeek = now.getDay();
  let sent = 0;

  for (const user of users) {
    const localHour = getLocalHour(now, user.timezone);
    const slot = Object.entries(TIME_OF_DAY_HOURS).find(([, h]) => h === localHour)?.[0];
    if (!slot) continue;

    const routines = await prisma.routine.findMany({
      where: {
        userId: user.id,
        timeOfDay: slot as "MORNING" | "AFTERNOON" | "EVENING" | "NIGHT",
        reminderEnabled: true,
        OR: [
          { daysOfWeek: { isEmpty: true } },
          { daysOfWeek: { has: dayOfWeek } },
        ],
      },
      include: {
        logs: { where: { date: today }, select: { completed: true } },
      },
    });

    const pending = routines.filter((r) => !r.logs[0]?.completed);
    if (pending.length === 0) continue;

    const titles = pending.slice(0, 3).map((r) => r.title).join(", ");
    const more = pending.length > 3 ? ` 외 ${pending.length - 3}개` : "";

    const result = await sendPushToUser(
      user.id,
      {
        title: slotLabel(slot),
        body: `${titles}${more} 잊지 마세요 ✨`,
        url: "/routines",
        tag: `routines-${slot}-${today.toISOString().slice(0, 10)}`,
      },
      { logType: "NOTIFICATION" },
    );

    if (result.sent > 0) sent += 1;
  }

  return NextResponse.json({ ok: true, sent });
}

function getLocalHour(now: Date, timezone: string): number {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    hour12: false,
  });
  return Number(fmt.format(now));
}

function slotLabel(slot: string): string {
  switch (slot) {
    case "MORNING": return "🌅 아침 루틴 시간이에요";
    case "AFTERNOON": return "🌞 점심 루틴";
    case "EVENING": return "🌆 저녁 루틴";
    case "NIGHT": return "🌙 자기 전 루틴";
    default: return "✓ 루틴 알림";
  }
}
