"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { SharedEventCategory } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth/dal";
import { getActivePartnership } from "@/lib/data/partnership";

const InputSchema = z.object({
  title: z.string().min(1).max(100).trim(),
  description: z.string().max(500).optional().nullable(),
  date: z.iso.date(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  isAllDay: z.boolean().default(false),
  category: z.enum(SharedEventCategory),
  isAnniversary: z.boolean().default(false),
});

export type SharedEventState =
  | { errors?: Record<string, string[]>; message?: string }
  | undefined;

function combineDateTime(date: string, time: string) {
  const [h, m] = time.split(":").map(Number);
  const [y, mo, d] = date.split("-").map(Number);
  return new Date(y, mo - 1, d, h, m);
}

export async function createSharedEvent(
  _state: SharedEventState,
  formData: FormData,
): Promise<SharedEventState> {
  const session = await verifySession();
  const partnership = await getActivePartnership();
  if (!partnership) return { message: "파트너십이 필요해요." };

  const parsed = InputSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || null,
    date: formData.get("date"),
    startTime: formData.get("startTime") || "10:00",
    endTime: formData.get("endTime") || "12:00",
    isAllDay: formData.get("isAllDay") === "on",
    category: formData.get("category"),
    isAnniversary: formData.get("isAnniversary") === "on",
  });

  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors };
  }

  const { date, startTime, endTime, isAllDay, ...rest } = parsed.data;
  const startDate = isAllDay
    ? combineDateTime(date, "00:00")
    : combineDateTime(date, startTime);
  const endDate = isAllDay
    ? combineDateTime(date, "23:59")
    : combineDateTime(date, endTime);

  await prisma.sharedEvent.create({
    data: {
      partnershipId: partnership.id,
      title: rest.title,
      description: rest.description ?? null,
      category: rest.category,
      isAnniversary: rest.isAnniversary,
      isAllDay,
      startDate,
      endDate,
      createdById: session.userId,
    },
  });

  revalidatePath("/shared/calendar");
  revalidatePath("/shared");
  redirect("/shared/calendar");
}

export async function deleteSharedEvent(eventId: string) {
  const partnership = await getActivePartnership();
  if (!partnership) return;
  await prisma.sharedEvent.deleteMany({
    where: { id: eventId, partnershipId: partnership.id },
  });
  revalidatePath("/shared/calendar");
  revalidatePath("/shared");
}
