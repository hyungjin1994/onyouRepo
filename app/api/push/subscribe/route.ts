import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth/dal";

export const runtime = "nodejs";

const SubscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

export async function POST(request: Request) {
  const session = await verifySession();

  const body = await request.json().catch(() => null);
  const parsed = SubscribeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid-subscription" }, { status: 400 });
  }

  const ua = request.headers.get("user-agent") ?? null;
  const { endpoint, keys } = parsed.data;

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: {
      userId: session.userId,
      p256dh: keys.p256dh,
      auth: keys.auth,
      userAgent: ua,
      lastSeenAt: new Date(),
    },
    create: {
      userId: session.userId,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      userAgent: ua,
    },
  });

  await prisma.user.update({
    where: { id: session.userId },
    data: { pushEnabled: true },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const session = await verifySession();
  const url = new URL(request.url);
  const endpoint = url.searchParams.get("endpoint");

  if (endpoint) {
    await prisma.pushSubscription.deleteMany({
      where: { endpoint, userId: session.userId },
    });
  } else {
    await prisma.pushSubscription.deleteMany({
      where: { userId: session.userId },
    });
    await prisma.user.update({
      where: { id: session.userId },
      data: { pushEnabled: false },
    });
  }

  return NextResponse.json({ ok: true });
}
