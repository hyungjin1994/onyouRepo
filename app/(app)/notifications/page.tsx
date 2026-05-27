import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { InteractionType } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Card, CardDescription } from "@/components/ui/card";
import { verifySession } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "알림 · LifeOS" };

const TYPE_META: Record<
  Exclude<InteractionType, "CHAT">,
  { label: string; emoji: string; accent: string }
> = {
  NOTIFICATION:   { label: "알림",   emoji: "🔔", accent: "bg-bg-lavender" },
  RECOMMENDATION: { label: "추천",   emoji: "💡", accent: "bg-bg-yellow" },
  INSIGHT:        { label: "인사이트", emoji: "📊", accent: "bg-bg-mint" },
};

export default async function NotificationsCenterPage() {
  const session = await verifySession();

  const rows = await prisma.aIInteraction.findMany({
    where: {
      userId: session.userId,
      type: { in: ["NOTIFICATION", "RECOMMENDATION", "INSIGHT"] },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <main className="flex flex-col gap-6 px-6 pt-10 pb-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">🔔 알림</h1>
        <Button asChild size="sm" variant="ghost">
          <Link href="/profile/notifications">설정</Link>
        </Button>
      </header>

      {rows.length === 0 ? (
        <Card className="text-center">
          <CardDescription>
            아직 받은 알림이 없어요.
            <br />
            푸시를 켜두면 여기에 기록돼요.
          </CardDescription>
          <Button asChild size="sm" variant="soft" className="mt-4 self-center">
            <Link href="/profile/notifications">알림 켜기</Link>
          </Button>
        </Card>
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((row) => {
            const type = row.type as Exclude<InteractionType, "CHAT">;
            const meta = TYPE_META[type] ?? TYPE_META.NOTIFICATION;
            return (
              <li key={row.id}>
                <article className="flex items-start gap-3 rounded-card bg-surface px-4 py-3 shadow-card">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-lg ${meta.accent}`}
                  >
                    {meta.emoji}
                  </span>
                  <div className="flex flex-1 flex-col gap-0.5">
                    <p className="text-sm font-medium">{row.content}</p>
                    {row.response && (
                      <p className="text-xs text-foreground-muted">{row.response}</p>
                    )}
                    <time
                      className="mt-0.5 text-[11px] text-foreground-weak"
                      dateTime={row.createdAt.toISOString()}
                      title={format(row.createdAt, "yyyy.MM.dd HH:mm", { locale: ko })}
                    >
                      {formatDistanceToNow(row.createdAt, { addSuffix: true, locale: ko })}
                    </time>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
