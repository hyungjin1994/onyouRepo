import "server-only";

import { cache } from "react";
import { startOfMonth, endOfMonth } from "date-fns";
import { ExpenseCategory } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getActivePartnership } from "@/lib/data/partnership";

export type MonthlyBreakdown = {
  byUser: Record<string, number>;
  byCategory: Record<ExpenseCategory, number>;
  total: number;
  count: number;
};

export const getExpensesForMonth = cache(async (now = new Date()) => {
  const partnership = await getActivePartnership();
  if (!partnership) return null;

  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const expenses = await prisma.expense.findMany({
    where: {
      partnershipId: partnership.id,
      date: { gte: monthStart, lte: monthEnd },
    },
    orderBy: { date: "desc" },
  });

  return { partnership, expenses, monthStart, monthEnd };
});

/**
 * Breakdown stats for a list of expenses — totals per user and per category.
 * Pure aggregation; safe to call from a server component after fetching once.
 */
export function summarizeExpenses(
  expenses: { amount: number; paidById: string; category: ExpenseCategory }[],
): MonthlyBreakdown {
  const byUser: Record<string, number> = {};
  const byCategory: Record<ExpenseCategory, number> = {
    [ExpenseCategory.FOOD]: 0,
    [ExpenseCategory.TRANSPORT]: 0,
    [ExpenseCategory.HOUSING]: 0,
    [ExpenseCategory.ENTERTAINMENT]: 0,
    [ExpenseCategory.SHOPPING]: 0,
    [ExpenseCategory.HEALTH]: 0,
    [ExpenseCategory.OTHER]: 0,
  };
  let total = 0;

  for (const e of expenses) {
    byUser[e.paidById] = (byUser[e.paidById] ?? 0) + e.amount;
    byCategory[e.category] += e.amount;
    total += e.amount;
  }

  return { byUser, byCategory, total, count: expenses.length };
}

/**
 * Compute settlement: split total 50/50 between the pair and figure out
 * who owes whom how much. Returns null if either side hasn't contributed at all
 * (no point in surfacing a "owe yourself" line).
 */
export function computeSettlement(
  ownerId: string,
  partnerId: string,
  byUser: Record<string, number>,
): { fromId: string; toId: string; amount: number } | null {
  const ownerPaid = byUser[ownerId] ?? 0;
  const partnerPaid = byUser[partnerId] ?? 0;
  const total = ownerPaid + partnerPaid;
  if (total === 0) return null;

  const half = total / 2;
  const ownerDiff = ownerPaid - half;
  // Positive ownerDiff: owner overpaid → partner owes owner.
  if (Math.abs(ownerDiff) < 1) return null;
  if (ownerDiff > 0) {
    return { fromId: partnerId, toId: ownerId, amount: Math.round(ownerDiff) };
  }
  return { fromId: ownerId, toId: partnerId, amount: Math.round(-ownerDiff) };
}
