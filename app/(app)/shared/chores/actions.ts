"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { startOfDay } from "date-fns";
import { z } from "zod";
import { AssignmentType, ChoreFrequency } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth/dal";
import {
  computeAssignee,
} from "@/lib/data/chores";
import { getActivePartnership } from "@/lib/data/partnership";

const ChoreInputSchema = z.object({
  title: z.string().min(1).max(80).trim(),
  emoji: z.string().max(4).optional().nullable(),
  frequency: z.enum(ChoreFrequency),
  assignmentType: z.enum(AssignmentType),
  fixedAssigneeId: z.string().uuid().optional().nullable(),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).default([]),
  estimatedTime: z.preprocess(
    (v) => (v === "" || v === null ? null : Number(v)),
    z.number().int().min(1).max(600).nullable(),
  ),
});

export type ChoreFormState =
  | { errors?: Record<string, string[]>; message?: string }
  | undefined;

export async function createChore(
  _state: ChoreFormState,
  formData: FormData,
): Promise<ChoreFormState> {
  const partnership = await getActivePartnership();
  if (!partnership || !partnership.partnerId) {
    return { message: "파트너십이 필요해요." };
  }

  const days = formData.getAll("daysOfWeek").map(Number).filter((n) => !Number.isNaN(n));

  const parsed = ChoreInputSchema.safeParse({
    title: formData.get("title"),
    emoji: formData.get("emoji") || null,
    frequency: formData.get("frequency"),
    assignmentType: formData.get("assignmentType"),
    fixedAssigneeId: formData.get("fixedAssigneeId") || null,
    daysOfWeek: days,
    estimatedTime: formData.get("estimatedTime") || null,
  });

  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors };
  }

  // FIXED 방식이면 fixedAssigneeId 필수 + 파트너십 멤버여야 함
  let fixedAssigneeId: string | null = null;
  if (parsed.data.assignmentType === AssignmentType.FIXED) {
    if (!parsed.data.fixedAssigneeId) {
      return { errors: { fixedAssigneeId: ["담당자를 선택해주세요"] } };
    }
    if (
      parsed.data.fixedAssigneeId !== partnership.ownerId &&
      parsed.data.fixedAssigneeId !== partnership.partnerId
    ) {
      return { errors: { fixedAssigneeId: ["파트너십에 속하지 않은 사용자입니다"] } };
    }
    fixedAssigneeId = parsed.data.fixedAssigneeId;
  }

  await prisma.chore.create({
    data: {
      partnershipId: partnership.id,
      title: parsed.data.title,
      emoji: parsed.data.emoji ?? null,
      frequency: parsed.data.frequency,
      assignmentType: parsed.data.assignmentType,
      fixedAssigneeId,
      daysOfWeek: parsed.data.daysOfWeek,
      estimatedTime: parsed.data.estimatedTime,
    },
  });

  revalidatePath("/shared/chores");
  revalidatePath("/shared");
  redirect("/shared/chores");
}

export async function toggleChoreLog(choreId: string) {
  const session = await verifySession();
  const partnership = await getActivePartnership();
  if (!partnership || !partnership.partnerId) return;

  const chore = await prisma.chore.findFirst({
    where: { id: choreId, partnershipId: partnership.id },
  });
  if (!chore) return;

  const today = startOfDay(new Date());
  const expectedAssignee = computeAssignee(
    chore,
    partnership.ownerId,
    partnership.partnerId,
    today,
  );

  const existing = await prisma.choreLog.findUnique({
    where: { choreId_date: { choreId, date: today } },
  });

  if (existing) {
    if (existing.completedAt) {
      await prisma.choreLog.update({
        where: { id: existing.id },
        data: { completedAt: null, completedById: null },
      });
    } else {
      await prisma.choreLog.update({
        where: { id: existing.id },
        data: { completedAt: new Date(), completedById: session.userId },
      });
    }
  } else {
    await prisma.choreLog.create({
      data: {
        choreId,
        date: today,
        assignedToId: expectedAssignee,
        completedAt: new Date(),
        completedById: session.userId,
      },
    });
  }

  revalidatePath("/shared/chores");
  revalidatePath("/shared");
}

export async function deleteChore(choreId: string) {
  const partnership = await getActivePartnership();
  if (!partnership) return;
  await prisma.chore.deleteMany({
    where: { id: choreId, partnershipId: partnership.id },
  });
  revalidatePath("/shared/chores");
  revalidatePath("/shared");
}

export async function sendThanks(toUserId: string, choreLogId?: string) {
  const session = await verifySession();
  const partnership = await getActivePartnership();
  if (!partnership) return;

  await prisma.thankYou.create({
    data: {
      partnershipId: partnership.id,
      fromUserId: session.userId,
      toUserId,
      message: "고마워 ❤️",
      relatedChoreLogId: choreLogId ?? null,
    },
  });
  revalidatePath("/shared/chores");
  revalidatePath("/shared/thanks");
}
