"use client";

import { useActionState, useState } from "react";
import { ExpenseCategory } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { EXPENSE_CATEGORY_OPTIONS } from "@/lib/expenses";

import { createExpense } from "../actions";

type Props = {
  today: string;          // YYYY-MM-DD
  currentUserId: string;
  payers: { id: string; label: string }[];
};

export function NewExpenseForm({ today, currentUserId, payers }: Props) {
  const [state, action, pending] = useActionState(createExpense, undefined);
  const [category, setCategory] = useState<ExpenseCategory>(ExpenseCategory.FOOD);
  const [paidById, setPaidById] = useState<string>(currentUserId);

  return (
    <form action={action} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="amount">금액 (원)</Label>
        <Input
          id="amount"
          name="amount"
          type="number"
          inputMode="numeric"
          min={1}
          required
          placeholder="예: 12000"
        />
        {state?.errors?.amount?.[0] && (
          <p className="text-xs text-pink">{state.errors.amount[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label>카테고리</Label>
        <div className="grid grid-cols-4 gap-2">
          {EXPENSE_CATEGORY_OPTIONS.map((opt) => (
            <label key={opt.value} className="cursor-pointer">
              <input
                type="radio"
                name="category"
                value={opt.value}
                checked={category === opt.value}
                onChange={() => setCategory(opt.value)}
                className="peer sr-only"
                required
              />
              <span
                className={cn(
                  "flex flex-col items-center gap-1 rounded-2xl border border-border bg-surface py-3 text-[11px] transition-colors",
                  "peer-checked:border-lavender peer-checked:bg-bg-lavender",
                )}
              >
                <span className="text-base">{opt.emoji}</span>
                {opt.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">메모 (선택)</Label>
        <Input
          id="description"
          name="description"
          maxLength={80}
          placeholder="예: 동네 카페에서 브런치"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>결제자</Label>
        <div className="grid grid-cols-2 gap-2">
          {payers.map((p) => (
            <label key={p.id} className="cursor-pointer">
              <input
                type="radio"
                name="paidById"
                value={p.id}
                checked={paidById === p.id}
                onChange={() => setPaidById(p.id)}
                className="peer sr-only"
                required
              />
              <span
                className={cn(
                  "flex items-center justify-center rounded-2xl border border-border bg-surface py-3 text-sm transition-colors",
                  "peer-checked:border-lavender peer-checked:bg-bg-lavender peer-checked:font-medium",
                )}
              >
                {p.label}
              </span>
            </label>
          ))}
        </div>
        {state?.errors?.paidById?.[0] && (
          <p className="text-xs text-pink">{state.errors.paidById[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="date">날짜</Label>
        <Input
          id="date"
          name="date"
          type="date"
          required
          defaultValue={today}
          max={today}
        />
        {state?.errors?.date?.[0] && (
          <p className="text-xs text-pink">{state.errors.date[0]}</p>
        )}
      </div>

      {state?.message && (
        <p className="rounded-2xl bg-bg-pink px-4 py-3 text-xs text-foreground">
          {state.message}
        </p>
      )}

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "저장 중..." : "지출 추가"}
      </Button>
    </form>
  );
}
