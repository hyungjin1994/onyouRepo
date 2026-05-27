"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { startOfDay } from "date-fns";
import { z } from "zod";
import { RoutineCategory, TimeOfDay } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth/dal";

const RoutineInputSchema = z.object({
  title: z.string().min(1, { error: "이름을 입력해주세요." }).max(80).trim(),
  timeOfDay: z.enum(TimeOfDay),
  category: z.enum(RoutineCategory),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).default([]),
});

export type RoutineFormState =
  | { errors?: Record<string, string[]>; message?: string }
  | undefined;

export async function createRoutine(
  _state: RoutineFormState,
  formData: FormData,
): Promise<RoutineFormState> {
  const session = await verifySession();

  const days = formData.getAll("daysOfWeek").map(Number).filter((n) => !Number.isNaN(n));

  const parsed = RoutineInputSchema.safeParse({
    title: formData.get("title"),
    timeOfDay: formData.get("timeOfDay"),
    category: formData.get("category"),
    daysOfWeek: days,
  });

  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors };
  }

  await prisma.routine.create({
    data: {
      userId: session.userId,
      title: parsed.data.title,
      timeOfDay: parsed.data.timeOfDay,
      category: parsed.data.category,
      daysOfWeek: parsed.data.daysOfWeek,
    },
  });

  revalidatePath("/routines");
  revalidatePath("/home");
  redirect("/routines");
}

export async function toggleRoutineLog(routineId: string) {
  const session = await verifySession();

  const routine = await prisma.routine.findFirst({
    where: { id: routineId, userId: session.userId },
    select: { id: true },
  });
  if (!routine) return;

  const today = startOfDay(new Date());

  const existing = await prisma.routineLog.findUnique({
    where: { routineId_date: { routineId, date: today } },
  });

  if (existing) {
    if (existing.completed) {
      await prisma.routineLog.update({
        where: { id: existing.id },
        data: { completed: false, completedAt: null },
      });
    } else {
      await prisma.routineLog.update({
        where: { id: existing.id },
        data: { completed: true, completedAt: new Date() },
      });
    }
  } else {
    await prisma.routineLog.create({
      data: {
        routineId,
        date: today,
        completed: true,
        completedAt: new Date(),
      },
    });
  }

  revalidatePath("/routines");
  revalidatePath("/home");
}

export async function deleteRoutine(routineId: string, redirectTo?: string) {
  const session = await verifySession();
  await prisma.routine.deleteMany({
    where: { id: routineId, userId: session.userId },
  });
  revalidatePath("/routines");
  revalidatePath("/home");
  if (redirectTo) redirect(redirectTo);
}
