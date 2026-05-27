"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth/dal";

const Schema = z.object({
  date: z.iso.date(),
  weight: z.preprocess(
    (v) => Number(v),
    z.number().min(20).max(300),
  ),
  bodyFat: z.preprocess(
    (v) => (v === "" || v === null ? null : Number(v)),
    z.number().min(0).max(60).nullable(),
  ),
  muscleMass: z.preprocess(
    (v) => (v === "" || v === null ? null : Number(v)),
    z.number().min(0).max(150).nullable(),
  ),
  note: z.string().max(200).optional().nullable(),
});

export type WeightLogState =
  | { errors?: Record<string, string[]>; message?: string; ok?: boolean }
  | undefined;

export async function createWeightLog(
  _state: WeightLogState,
  formData: FormData,
): Promise<WeightLogState> {
  const session = await verifySession();

  const parsed = Schema.safeParse({
    date: formData.get("date"),
    weight: formData.get("weight"),
    bodyFat: formData.get("bodyFat") || null,
    muscleMass: formData.get("muscleMass") || null,
    note: formData.get("note") || null,
  });

  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors };
  }

  const [y, m, d] = parsed.data.date.split("-").map(Number);
  const date = new Date(y, m - 1, d);

  await prisma.weightLog.upsert({
    where: { userId_date: { userId: session.userId, date } },
    update: {
      weight: parsed.data.weight,
      bodyFat: parsed.data.bodyFat,
      muscleMass: parsed.data.muscleMass,
      note: parsed.data.note ?? null,
    },
    create: {
      userId: session.userId,
      date,
      weight: parsed.data.weight,
      bodyFat: parsed.data.bodyFat,
      muscleMass: parsed.data.muscleMass,
      note: parsed.data.note ?? null,
    },
  });

  await prisma.user.update({
    where: { id: session.userId },
    data: { weight: parsed.data.weight },
  });

  revalidatePath("/profile/weight");
  revalidatePath("/profile");
  revalidatePath("/home");
  return { ok: true };
}
