"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { startOfDay } from "date-fns";
import { z } from "zod";
import { ExpenseCategory } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth/dal";
import { getActivePartnership } from "@/lib/data/partnership";

const ExpenseSchema = z.object({
  amount: z.preprocess(
    (v) => (v === "" || v === null ? NaN : Number(v)),
    z.number().int().min(1, { error: "금액을 입력해주세요" }).max(10_000_000),
  ),
  category: z.enum(ExpenseCategory),
  description: z.string().max(80).optional().nullable(),
  paidById: z.string().uuid({ error: "결제자를 선택해주세요" }),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { error: "날짜가 올바르지 않아요" }),
});

export type ExpenseFormState =
  | { errors?: Record<string, string[]>; message?: string }
  | undefined;

export async function createExpense(
  _state: ExpenseFormState,
  formData: FormData,
): Promise<ExpenseFormState> {
  await verifySession();
  const partnership = await getActivePartnership();
  if (!partnership || !partnership.partnerId) {
    return { message: "활성화된 파트너십이 필요해요" };
  }

  const parsed = ExpenseSchema.safeParse({
    amount: formData.get("amount"),
    category: formData.get("category"),
    description: (formData.get("description") as string) || null,
    paidById: formData.get("paidById"),
    date: formData.get("date"),
  });

  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors };
  }

  // paidById must be one of the partnership members.
  if (
    parsed.data.paidById !== partnership.ownerId &&
    parsed.data.paidById !== partnership.partnerId
  ) {
    return { errors: { paidById: ["파트너십에 속하지 않은 사용자입니다"] } };
  }

  await prisma.expense.create({
    data: {
      partnershipId: partnership.id,
      amount: parsed.data.amount,
      category: parsed.data.category,
      description: parsed.data.description ?? null,
      paidById: parsed.data.paidById,
      date: startOfDay(new Date(parsed.data.date)),
    },
  });

  revalidatePath("/shared/budget");
  revalidatePath("/shared");
  redirect("/shared/budget");
}

export async function deleteExpense(expenseId: string) {
  await verifySession();
  const partnership = await getActivePartnership();
  if (!partnership) return;

  await prisma.expense.deleteMany({
    where: { id: expenseId, partnershipId: partnership.id },
  });

  revalidatePath("/shared/budget");
  revalidatePath("/shared");
}
