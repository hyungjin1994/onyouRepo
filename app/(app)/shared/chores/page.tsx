import Link from "next/link";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { verifySession } from "@/lib/auth/dal";
import {
  getAllChores,
  getChoresForToday,
  getFairnessStats,
} from "@/lib/data/chores";
import { getActivePartnership } from "@/lib/data/partnership";
import { CHORE_FREQUENCY_META } from "@/lib/chores";
import { ChoreCheck } from "./_components/chore-check";
import { ChoreDelete } from "./_components/chore-delete";
import { ThanksButton } from "./_components/thanks-button";
import { FairnessBar } from "./_components/fairness-bar";
import { cn } from "@/lib/utils";

export const metadata = { title: "가사 분담 · LifeOS" };

export default async function ChoresPage() {
  const session = await verifySession();
  const partnership = await getActivePartnership();
  if (!partnership) {
    return (
      <main className="px-6 pt-10">
        <Card className="text-center text-sm text-foreground-muted">
          파트너십이 필요해요.
        </Card>
      </main>
    );
  }

  const [chores, allChores, fairness] = await Promise.all([
    getChoresForToday(),
    getAllChores(),
    getFairnessStats(),
  ]);

  const ownerLabel =
    partnership.ownerId === session.userId ? "나" : partnership.owner.name ?? "A";
  const partnerLabel =
    partnership.partnerId === session.userId
      ? "나"
      : partnership.partner?.name ?? "B";

  return (
    <main className="flex flex-col gap-6 px-6 pt-10">
      <header className="flex items-center justify-between">
        <div>
          <Link href="/shared" className="text-foreground-muted text-xs">
            ‹ 우리
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">🏠 가사 분담</h1>
          <p className="text-xs text-foreground-muted">
            {format(new Date(), "M월 d일 (E)", { locale: ko })}
          </p>
        </div>
        <Button asChild size="sm" variant="soft">
          <Link href="/shared/chores/new">+ 가사</Link>
        </Button>
      </header>

      {fairness && (
        <Card>
          <div className="flex items-center justify-between">
            <p className="text-xs text-foreground-muted">이번 주 분담</p>
            <Link
              href="/shared/chores/fairness"
              className="text-[11px] text-foreground-weak"
            >
              자세히 ›
            </Link>
          </div>
          <FairnessBar
            ownerLabel={ownerLabel}
            partnerLabel={partnerLabel}
            ownerPct={fairness.week.ownerPct}
            partnerPct={fairness.week.partnerPct}
            ownerCount={fairness.week.owner}
            partnerCount={fairness.week.partner}
          />
        </Card>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">오늘의 가사</h2>
        {chores.length === 0 ? (
          <Card className="text-center text-sm text-foreground-muted">
            오늘은 등록된 가사가 없어요.
          </Card>
        ) : (
          <ul className="flex flex-col gap-2">
            {chores.map((chore) => {
              const isMine = chore.todayAssigneeId === session.userId;
              const done = !!chore.todayLog?.completedAt;
              const showThanks =
                done &&
                chore.todayLog?.completedById &&
                chore.todayLog.completedById !== session.userId;

              return (
                <li
                  key={chore.id}
                  className={cn(
                    "flex items-center gap-3 rounded-card bg-surface px-4 py-3 shadow-card transition-opacity",
                    done && "opacity-70",
                  )}
                >
                  <ChoreCheck choreId={chore.id} completed={done} />
                  <div className="flex flex-1 flex-col">
                    <span
                      className={cn(
                        "text-sm font-medium",
                        done && "text-foreground-muted line-through",
                      )}
                    >
                      {chore.emoji ?? "🧹"} {chore.title}
                    </span>
                    <span className="text-[11px] text-foreground-weak">
                      {isMine ? "내 차례" : `${partnerLabel}의 차례`}
                      {chore.estimatedTime ? ` · ${chore.estimatedTime}분` : ""}
                    </span>
                  </div>
                  {showThanks && chore.todayLog?.completedById && (
                    <ThanksButton
                      toUserId={chore.todayLog.completedById}
                      choreLogId={chore.todayLog.id}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {allChores.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-foreground-muted">전체 가사 ({allChores.length})</h2>
          <ul className="flex flex-col gap-2">
            {allChores.map((chore) => (
              <li
                key={chore.id}
                className="flex items-center gap-3 rounded-2xl bg-surface px-4 py-2.5 shadow-card"
              >
                <span className="text-base">{chore.emoji ?? "🧹"}</span>
                <div className="flex flex-1 flex-col">
                  <span className="text-sm font-medium">{chore.title}</span>
                  <span className="text-[11px] text-foreground-weak">
                    {CHORE_FREQUENCY_META[chore.frequency]?.label}
                    {chore.estimatedTime ? ` · ${chore.estimatedTime}분` : ""}
                  </span>
                </div>
                <Link
                  href={`/shared/chores/${chore.id}/edit`}
                  className="text-[11px] text-foreground-muted hover:text-foreground"
                >
                  수정
                </Link>
                <ChoreDelete choreId={chore.id} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}

