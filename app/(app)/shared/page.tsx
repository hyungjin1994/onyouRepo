import Link from "next/link";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  getActivePartnership,
  getMyPendingInvite,
} from "@/lib/data/partnership";
import { verifySession } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { InviteCard } from "./_components/invite-card";
import { JoinForm } from "./_components/join-form";
import { cancelInvite, createInvite, leavePartnership } from "./actions";

export const metadata = { title: "우리 · LifeOS" };

export default async function SharedHome() {
  const session = await verifySession();
  const active = await getActivePartnership();

  if (active) {
    return <ActiveDashboard partnership={active} currentUserId={session.userId} />;
  }

  const pending = await getMyPendingInvite();

  return (
    <main className="flex flex-col gap-6 px-6 pt-10">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">👥 우리</h1>
        <p className="text-xs text-foreground-muted">
          파트너를 초대하거나 코드를 받아 함께 시작해요
        </p>
      </header>

      {pending ? (
        <InviteCard code={pending.inviteCode} createdAt={pending.createdAt} />
      ) : (
        <form action={createInvite}>
          <Button type="submit" size="lg" className="w-full">
            ✨ 초대 코드 만들기
          </Button>
        </form>
      )}

      {pending && (
        <form action={cancelInvite}>
          <Button
            type="submit"
            size="sm"
            variant="ghost"
            className="self-center text-foreground-weak hover:text-pink"
          >
            초대 취소
          </Button>
        </form>
      )}

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-[10px] text-foreground-weak">또는</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">코드로 참여하기</h2>
        <JoinForm />
      </section>
    </main>
  );
}

async function ActiveDashboard({
  partnership,
  currentUserId,
}: {
  partnership: NonNullable<Awaited<ReturnType<typeof getActivePartnership>>>;
  currentUserId: string;
}) {
  const other =
    partnership.ownerId === currentUserId
      ? partnership.partner
      : partnership.owner;

  // Tiny live counters for the dashboard tiles.
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const [pendingChores, pendingShopping, upcomingEvents, monthExpenses] =
    await Promise.all([
      prisma.chore.count({ where: { partnershipId: partnership.id } }),
      prisma.shoppingItem.count({
        where: { partnershipId: partnership.id, purchased: false },
      }),
      prisma.sharedEvent.count({
        where: {
          partnershipId: partnership.id,
          startDate: { gte: new Date() },
        },
      }),
      prisma.expense.count({
        where: { partnershipId: partnership.id, date: { gte: monthStart } },
      }),
    ]);

  return (
    <main className="flex flex-col gap-6 px-6 pt-10">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">👥 우리</h1>
        <p className="text-xs text-foreground-muted">
          {other?.name ?? other?.email ?? "파트너"}와 함께한 지{" "}
          {partnership.startedAt
            ? format(partnership.startedAt, "yyyy년 M월 d일", { locale: ko })
            : "오늘"}
          부터
        </p>
      </header>

      <nav className="grid grid-cols-2 gap-3">
        <Tile href="/shared/chores" emoji="🏠" title="가사 분담" count={pendingChores} unit="개" />
        <Tile href="/shared/shopping" emoji="🛒" title="장보기" count={pendingShopping} unit="개" />
        <Tile href="/shared/calendar" emoji="📅" title="공동 캘린더" count={upcomingEvents} unit="건" />
        <Tile href="/shared/budget" emoji="💰" title="가계부" count={monthExpenses} unit="건" />
        <Tile href="/shared/goals" emoji="🎯" title="함께 목표" />
      </nav>

      <Card>
        <p className="text-sm">💌 함께한 감사</p>
        <p className="mt-1 text-xs text-foreground-muted">
          가사 완료 시 ‘고마워’를 한 번씩 보내보세요.
        </p>
        <Link
          href="/shared/thanks"
          className="mt-3 inline-flex self-start rounded-full bg-bg-pink px-3 py-1.5 text-[11px] text-foreground"
        >
          누적 감사 보기 →
        </Link>
      </Card>

      <form action={leavePartnership} className="self-center">
        <Button
          type="submit"
          size="sm"
          variant="ghost"
          className="text-foreground-weak hover:text-pink"
        >
          파트너십 일시정지
        </Button>
      </form>
    </main>
  );
}

function Tile({
  href,
  emoji,
  title,
  count,
  unit,
}: {
  href: string;
  emoji: string;
  title: string;
  count?: number;
  unit?: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-2 rounded-card bg-surface p-4 shadow-card hover:bg-bg-lavender/30"
    >
      <span className="text-2xl">{emoji}</span>
      <span className="text-sm font-medium">{title}</span>
      {typeof count === "number" && (
        <span className="text-[11px] text-foreground-muted">
          {count > 0 ? `${count}${unit ?? ""}` : "비어있음"}
        </span>
      )}
    </Link>
  );
}
