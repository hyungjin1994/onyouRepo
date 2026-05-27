"use client";

import { useTransition } from "react";

import { deleteExpense } from "../actions";

export function ExpenseDelete({ expenseId }: { expenseId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => {
        if (!confirm("이 지출을 삭제할까요?")) return;
        startTransition(() => deleteExpense(expenseId));
      }}
      disabled={pending}
      className="text-[10px] text-foreground-weak hover:text-pink disabled:opacity-50"
    >
      삭제
    </button>
  );
}
