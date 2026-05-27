import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardDescription } from "@/components/ui/card";
import { verifySession } from "@/lib/auth/dal";
import { getActivePartnership } from "@/lib/data/partnership";
import { getFairnessStats, getPerChoreFairness } from "@/lib/data/chores";

import { FairnessBar } from "../_components/fairness-bar";

export const metadata = { title: "공평성 · LifeOS" };

export default async function FairnessDashboardPage() {
  const session = await verifySession();
  const partnership = await getActivePartnership();

  if (!partnership || !partnership.partnerId) {
    return (
      <main className="px-6 pt-10">
        <Card className="text-center text-sm text-foreground-muted">
          파트너십이 필요해요.
        </Card>
      </main>
    );
  }

  const [fairness, perChore] = await Promise.all([
    getFairnessStats(),
    getPerChoreFairness(),
  ]);

  const ownerLabel =
    partnership.ownerId === session.userId ? "나" : partnership.owner.name ?? "A";
  const partnerLabel =
    partnership.partnerId === session.userId
      ? "나"
      : partnership.partner?.name ?? "B";

  return (
    <main className="flex flex-col gap-6 px-6 pt-10 pb-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">⚖️ 공평성</h1>
        <Button asChild size="sm" variant="ghost">
          <Link href="/shared/chores">‹ 뒤로</Link>
        </Button>
      </header>

      {!fairness ? (
        <Card className="text-center text-sm text-foreground-muted">
          아직 가사 기록이 없어요. 첫 가사를 완료하면 통계가 나타나요.
        </Card>
      ) : (
        <>
          <Card>
            <p className="text-xs text-foreground-muted">이번 주</p>
            <FairnessBar
              ownerLabel={ownerLabel}
              partnerLabel={partnerLabel}
              ownerPct={fairness.week.ownerPct}
              partnerPct={fairness.week.partnerPct}
              ownerCount={fairness.week.owner}
              partnerCount={fairness.week.partner}
            />
            <p className="mt-5 text-xs text-foreground-muted">
              최근 {fairness.lookback.lookbackDays}일
            </p>
            <FairnessBar
              ownerLabel={ownerLabel}
              partnerLabel={partnerLabel}
              ownerPct={fairness.lookback.ownerPct}
              partnerPct={fairness.lookback.partnerPct}
              ownerCount={fairness.lookback.owner}
              partnerCount={fairness.lookback.partner}
            />
          </Card>

          <Card>
            <p className="mb-3 text-xs text-foreground-muted">시간 추정 (최근 30일)</p>
            <div className="grid grid-cols-2 gap-3 text-center">
              <TimeTile label={ownerLabel} minutes={fairness.minutes.owner} />
              <TimeTile label={partnerLabel} minutes={fairness.minutes.partner} />
            </div>
          </Card>

          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-medium text-foreground-muted">
              가사별 분담 (최근 30일)
            </h2>
            {perChore && perChore.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {perChore.map((chore) => {
                  const total = chore.total || 1;
                  const ownerPct = Math.round((chore.ownerCount / total) * 100);
                  const partnerPct = 100 - ownerPct;
                  return (
                    <li
                      key={chore.id}
                      className="flex flex-col gap-2 rounded-card bg-surface px-4 py-3 shadow-card"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {chore.emoji ?? "🧹"} {chore.title}
                        </span>
                        <span className="text-[11px] text-foreground-weak">
                          {chore.total}회
                        </span>
                      </div>
                      {chore.total === 0 ? (
                        <p className="text-[11px] text-foreground-weak">기록 없음</p>
                      ) : (
                        <FairnessBar
                          ownerLabel={ownerLabel}
                          partnerLabel={partnerLabel}
                          ownerPct={ownerPct}
                          partnerPct={partnerPct}
                          ownerCount={chore.ownerCount}
                          partnerCount={chore.partnerCount}
                        />
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <Card className="text-center text-sm text-foreground-muted">
                <CardDescription>등록된 가사가 없어요.</CardDescription>
              </Card>
            )}
          </section>
        </>
      )}
    </main>
  );
}

function TimeTile({ label, minutes }: { label: string; minutes: number }) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return (
    <div className="flex flex-col gap-1 rounded-2xl bg-bg-lavender/60 py-3">
      <span className="text-[11px] text-foreground-muted">{label}</span>
      <span className="text-sm font-bold">
        {h > 0 ? `${h}시간 ` : ""}
        {m}분
      </span>
    </div>
  );
}
