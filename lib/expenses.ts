import { ExpenseCategory } from "@prisma/client";

export const EXPENSE_CATEGORY_META: Record<
  ExpenseCategory,
  { label: string; emoji: string; chipColor: string }
> = {
  [ExpenseCategory.FOOD]:          { label: "식비",   emoji: "🍱", chipColor: "bg-bg-peach" },
  [ExpenseCategory.TRANSPORT]:     { label: "교통",   emoji: "🚇", chipColor: "bg-bg-sky" },
  [ExpenseCategory.HOUSING]:       { label: "주거",   emoji: "🏠", chipColor: "bg-bg-lavender" },
  [ExpenseCategory.ENTERTAINMENT]: { label: "여가",   emoji: "🎬", chipColor: "bg-bg-pink" },
  [ExpenseCategory.SHOPPING]:      { label: "쇼핑",   emoji: "🛍", chipColor: "bg-bg-mint" },
  [ExpenseCategory.HEALTH]:        { label: "건강",   emoji: "🩺", chipColor: "bg-bg-yellow" },
  [ExpenseCategory.OTHER]:         { label: "기타",   emoji: "✨", chipColor: "bg-bg-lavender" },
};

export const EXPENSE_CATEGORY_OPTIONS = (
  Object.entries(EXPENSE_CATEGORY_META) as [
    ExpenseCategory,
    (typeof EXPENSE_CATEGORY_META)[ExpenseCategory],
  ][]
).map(([value, meta]) => ({ value, ...meta }));

export function formatKRW(amount: number): string {
  return new Intl.NumberFormat("ko-KR").format(amount) + "원";
}
