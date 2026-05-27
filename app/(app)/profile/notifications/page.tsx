import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { verifySession } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { isPushConfigured } from "@/lib/push/vapid";

import { NotificationsForm } from "./notifications-form";

export const metadata = { title: "알림 설정 · LifeOS" };

export default async function NotificationsPage() {
  const session = await verifySession();
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      pushEnabled: true,
      dndStart: true,
      dndEnd: true,
      pushSubscriptions: { select: { id: true, userAgent: true, lastSeenAt: true } },
    },
  });

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
  const configured = isPushConfigured() && publicKey.length > 0;

  return (
    <main className="flex flex-col gap-6 px-6 pt-10">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">🔔 알림</h1>
        <Button asChild size="sm" variant="ghost">
          <Link href="/profile">‹ 뒤로</Link>
        </Button>
      </header>

      {!configured && (
        <Card className="bg-bg-yellow">
          <CardTitle>설정이 필요해요</CardTitle>
          <CardDescription className="mt-1">
            서버에 VAPID 키가 없어 푸시 알림을 켤 수 없어요. 관리자에게
            <code className="mx-1 rounded bg-surface/60 px-1 text-[11px]">VAPID_PUBLIC_KEY</code>
            <code className="mx-1 rounded bg-surface/60 px-1 text-[11px]">VAPID_PRIVATE_KEY</code>
            <code className="mx-1 rounded bg-surface/60 px-1 text-[11px]">NEXT_PUBLIC_VAPID_PUBLIC_KEY</code>
            설정을 요청해주세요.
          </CardDescription>
        </Card>
      )}

      <NotificationsForm
        publicKey={publicKey}
        configured={configured}
        defaults={{
          pushEnabled: user?.pushEnabled ?? false,
          dndStart: user?.dndStart ?? "23:00",
          dndEnd: user?.dndEnd ?? "07:00",
          deviceCount: user?.pushSubscriptions.length ?? 0,
        }}
      />
    </main>
  );
}
