"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { GoalCategory } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getActivePartnership } from "@/lib/data/partnership";

const InputSchema = z.object({
  title: z.string().min(1).max(100).trim(),
  emoji: z.string().max(4).optional().nullable(),
  category: z.enum(GoalCategory),
  targetAmount: z.preprocess(
    (v) => (v === "" || v === null ? null : Number(v)),
    z.number().min(0).nullable(),
  ),
  targetDate: z.string().optional().nullable(),
});

export type GoalFormState =
  | { errors?: Record<string, string[]>; message?: string }
  | undefined;

export async function createGoal(
  _state: GoalFormState,
  formData: FormData,
): Promise<GoalFormState> {
  const partnership = await getActivePartnership();
  if (!partnership) return { message: "파트너십이 필요해요." };

  const parsed = InputSchema.safeParse({
    title: formData.get("title"),
    emoji: formData.get("emoji") || null,
    category: formData.get("category"),
    targetAmount: formData.get("targetAmount") || null,
    targetDate: formData.get("targetDate") || null,
  });

  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors };
  }

  await prisma.sharedGoal.create({
    data: {
      partnershipId: partnership.id,
      title: parsed.data.title,
      emoji: parsed.data.emoji ?? null,
      category: parsed.data.category,
      targetAmount: parsed.data.targetAmount,
      targetDate: parsed.data.targetDate
        ? new Date(parsed.data.targetDate)
        : null,
    },
  });

  revalidatePath("/shared/goals");
  revalidatePath("/shared");
  redirect("/shared/goals");
}

export async function updateGoalProgress(goalId: string, amount: number) {
  const partnership = await getActivePartnership();
  if (!partnership) return;
  const goal = await prisma.sharedGoal.findFirst({
    where: { id: goalId, partnershipId: partnership.id },
  });
  if (!goal) return;

  const next = Math.max(0, goal.currentAmount + amount);
  const isComplete = goal.targetAmount !== null && next >= goal.targetAmount;

  await prisma.sharedGoal.update({
    where: { id: goalId },
    data: {
      currentAmount: next,
      completedAt: isComplete && !goal.completedAt ? new Date() : goal.completedAt,
    },
  });

  revalidatePath("/shared/goals");
}

export async function deleteGoal(goalId: string) {
  const partnership = await getActivePartnership();
  if (!partnership) return;
  await prisma.sharedGoal.deleteMany({
    where: { id: goalId, partnershipId: partnership.id },
  });
  revalidatePath("/shared/goals");
  revalidatePath("/shared");
}
