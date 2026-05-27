import Link from "next/link";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Card, CardDescription } from "@/components/ui/card";
import { verifySession } from "@/lib/auth/dal";
import { getActivePartnership } from "@/lib/data/partnership";
import {
  computeSettlement,
  getExpensesForMonth,
  summarizeExpenses,
} from "@/lib/data/expenses";
import { EXPENSE_CATEGORY_META, formatKRW } from "@/lib/expenses";

import { ExpenseDelete } from "./_components/expense-delete";

export const metadata = { title: "가계부 · LifeOS" };

export default async function BudgetPage() {
  const session = await verifySession();
  const partnership = await getActivePartnership();

  if (!partnership || !partnership.partnerId) {
    return (
      <main className="px-6 pt-10">
        <Card className="text-center text-sm text-foreground-muted">
          가계부는 파트너십이 활성화된 후 사용할 수 있어요.
        </Card>
      </main>
    );
  }

  const monthData = await getExpensesForMonth();
  if (!monthData) {
    return null;
  }

  const { expenses, monthStart } = monthData;
  const summary = summarizeExpenses(expenses);
  const settlement = computeSettlement(
    partnership.ownerId,
    partnership.partnerId,
    summary.byUser,
  );

  const ownerName =
    partnership.ownerId === session.userId ? "나" : partnership.owner.name ?? "A";
  const partnerName =
    partnership.partnerId === session.userId
      ? "나"
      : partnership.partner?.name ?? "B";
  const nameOf = (uid: string) =>
    uid === partnership.ownerId ? ownerName : partnerName;

  const ownerPaid = summary.byUser[partnership.ownerId] ?? 0;
  const partnerPaid = summary.byUser[partnership.partnerId] ?? 0;

  const sortedCategories = (
    Object.keys(summary.byCategory) as (keyof typeof EXPENSE_CATEGORY_META)[]
  )
    .filter((k) => summary.byCategory[k] > 0)
    .sort((a, b) => summary.byCategory[b] - summary.byCategory[a]);

  return (
    <main className="flex flex-col gap-6 px-6 pt-10 pb-6">
      <header className="flex items-center justify-between">
        <div>
          <Link href="/shared" className="text-foreground-muted text-xs">
            ‹ 우리
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">💰 가계부</h1>
          <p className="text-xs text-foreground-muted">
            {format(monthStart, "yyyy년 M월", { locale: ko })} · {summary.count}건
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/shared/budget/new">+ 지출</Link>
        </Button>
      </header>

      <Card>
        <p className="text-xs text-foreground-muted">이번 달 총 지출</p>
        <p className="mt-1 text-3xl font-bold">{formatKRW(summary.total)}</p>
        <div className="mt-4 grid grid-cols-2 gap-3 text-center">
          <PayTile name={ownerName} amount={ownerPaid} />
          <PayTile name={partnerName} amount={partnerPaid} />
        </div>
      </Card>

      <Card className="bg-bg-mint">
        <p className="text-xs text-foreground-muted">월말 정산</p>
        {settlement ? (
          <p className="mt-1 text-sm font-medium">
            <strong>{nameOf(settlement.fromId)}</strong>가{" "}
            <strong>{nameOf(settlement.toId)}</strong>에게{" "}
            <strong>{formatKRW(settlement.amount)}</strong> 송금하면 정산 완료
          </p>
        ) : (
          <p className="mt-1 text-sm text-foreground-muted">
            정산할 차이가 없어요 — 균등하게 잘 분담 중이에요 ✨
          </p>
        )}
      </Card>

      {sortedCategories.length > 0 && (
        <Card>
          <p className="text-xs text-foreground-muted">카테고리별 지출</p>
          <ul className="mt-3 flex flex-col gap-2 text-xs">
            {sortedCategories.map((cat) => {
              const meta = EXPENSE_CATEGORY_META[cat];
              const amount = summary.byCategory[cat];
              const pct = Math.round((amount / summary.total) * 100);
              return (
                <li key={cat} className="flex items-center gap-3">
                  <span className="w-14 text-foreground-muted">
                    {meta.emoji} {meta.label}
                  </span>
                  <div className="flex-1 overflow-hidden rounded-full bg-bg-lavender/40">
                    <div
                      className="h-2 rounded-full bg-lavender"
                      style={{ width: `${Math.max(8, pct)}%` }}
                    />
                  </div>
                  <span className="tabular-nums text-foreground-muted">
                    {formatKRW(amount)}
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">최근 지출</h2>
        {expenses.length === 0 ? (
          <Card className="text-center">
            <CardDescription>
              이번 달 지출이 없어요.
              <br />첫 지출을 추가해보세요.
            </CardDescription>
          </Card>
        ) : (
          <ul className="flex flex-col gap-2">
            {expenses.map((expense) => {
              const meta = EXPENSE_CATEGORY_META[expense.category];
              return (
                <li
                  key={expense.id}
                  className="flex items-center gap-3 rounded-card bg-surface px-4 py-3 shadow-card"
                >
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-2xl text-base ${meta.chipColor}`}
                  >
                    {meta.emoji}
                  </span>
                  <div className="flex flex-1 flex-col">
                    <span className="text-sm font-medium">
                      {expense.description?.trim() || meta.label}
                    </span>
                    <span className="text-[11px] text-foreground-muted">
                      {format(expense.date, "M월 d일", { locale: ko })} ·{" "}
                      {nameOf(expense.paidById)}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-sm font-bold tabular-nums">
                      {formatKRW(expense.amount)}
                    </span>
                    <ExpenseDelete expenseId={expense.id} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}

function PayTile({ name, amount }: { name: string; amount: number }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl bg-bg-lavender/60 py-3">
      <span className="text-[11px] text-foreground-muted">{name}</span>
      <span className="text-sm font-bold tabular-nums">{formatKRW(amount)}</span>
    </div>
  );
}
