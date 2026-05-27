import { NextResponse } from "next/server";
import { startOfWeek, endOfWeek, subWeeks } from "date-fns";

import { prisma } from "@/lib/prisma";
import { sendPushToUser } from "@/lib/push/send";
import { isAuthorizedCron } from "@/lib/push/authorize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 매주 월요일 오전 9시(서버 시간) — 지난 주 리포트를 푸시로 보내준다.
export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    where: { pushEnabled: true },
    select: { id: true, assistantName: true },
  });

  const lastWeek = subWeeks(new Date(), 1);
  const weekStart = startOfWeek(lastWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(lastWeek, { weekStartsOn: 1 });

  let sent = 0;

  for (const user of users) {
    const [workoutCount, routineDone] = await Promise.all([
      prisma.workout.count({
        where: { userId: user.id, startedAt: { gte: weekStart, lte: weekEnd } },
      }),
      prisma.routineLog.count({
        where: {
          completed: true,
          date: { gte: weekStart, lte: weekEnd },
          routine: { userId: user.id },
        },
      }),
    ]);

    if (workoutCount === 0 && routineDone === 0) continue;

    const bits: string[] = [];
    if (workoutCount) bits.push(`💪 운동 ${workoutCount}회`);
    if (routineDone) bits.push(`✓ 루틴 ${routineDone}개`);

    const result = await sendPushToUser(
      user.id,
      {
        title: "📊 지난 주 리포트",
        body: bits.join(" · "),
        url: "/insights",
        tag: `weekly-${weekStart.toISOString().slice(0, 10)}`,
      },
      { logType: "INSIGHT" },
    );

    if (result.sent > 0) sent += 1;
  }

  return NextResponse.json({ ok: true, sent });
}
