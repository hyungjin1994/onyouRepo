"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { EventCategory } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth/dal";

const EventInputSchema = z.object({
  title: z.string().min(1, { error: "제목을 입력해주세요." }).max(100).trim(),
  description: z.string().max(500).optional().nullable(),
  date: z.iso.date(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  isAllDay: z.boolean().default(false),
  category: z.enum(EventCategory),
});

export type EventFormState =
  | { errors?: Record<string, string[]>; message?: string }
  | undefined;

function combineDateTime(date: string, time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const d = new Date(date);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

export async function createEvent(
  _state: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  const session = await verifySession();

  const parsed = EventInputSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || null,
    date: formData.get("date"),
    startTime: formData.get("startTime") || "09:00",
    endTime: formData.get("endTime") || "10:00",
    isAllDay: formData.get("isAllDay") === "on",
    category: formData.get("category"),
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

  await prisma.event.create({
    data: {
      userId: session.userId,
      title: rest.title,
      description: rest.description ?? null,
      category: rest.category,
      isAllDay,
      startDate,
      endDate,
    },
  });

  revalidatePath("/calendar");
  revalidatePath("/home");
  redirect("/calendar");
}

export async function updateEvent(
  id: string,
  _state: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  const session = await verifySession();

  const parsed = EventInputSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || null,
    date: formData.get("date"),
    startTime: formData.get("startTime") || "09:00",
    endTime: formData.get("endTime") || "10:00",
    isAllDay: formData.get("isAllDay") === "on",
    category: formData.get("category"),
  });

  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors };
  }

  const existing = await prisma.event.findFirst({
    where: { id, userId: session.userId },
    select: { id: true },
  });
  if (!existing) return { message: "일정을 찾을 수 없어요." };

  const { date, startTime, endTime, isAllDay, ...rest } = parsed.data;
  const startDate = isAllDay
    ? combineDateTime(date, "00:00")
    : combineDateTime(date, startTime);
  const endDate = isAllDay
    ? combineDateTime(date, "23:59")
    : combineDateTime(date, endTime);

  await prisma.event.update({
    where: { id },
    data: {
      title: rest.title,
      description: rest.description ?? null,
      category: rest.category,
      isAllDay,
      startDate,
      endDate,
    },
  });

  revalidatePath("/calendar");
  revalidatePath(`/calendar/${id}`);
  revalidatePath("/home");
  redirect(`/calendar/${id}`);
}

export async function deleteEvent(id: string) {
  const session = await verifySession();
  await prisma.event.deleteMany({ where: { id, userId: session.userId } });
  revalidatePath("/calendar");
  revalidatePath("/home");
  redirect("/calendar");
}
