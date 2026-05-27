"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth/dal";

const HhMm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "HH:mm 형식이어야 해요");

const DndSchema = z.object({
  dndStart: HhMm,
  dndEnd: HhMm,
});

export type DndFormState =
  | { errors?: Record<string, string[]>; message?: string; ok?: boolean }
  | undefined;

export async function updateDnd(
  _state: DndFormState,
  formData: FormData,
): Promise<DndFormState> {
  const session = await verifySession();

  const parsed = DndSchema.safeParse({
    dndStart: formData.get("dndStart"),
    dndEnd: formData.get("dndEnd"),
  });

  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors };
  }

  await prisma.user.update({
    where: { id: session.userId },
    data: parsed.data,
  });

  revalidatePath("/profile/notifications");
  return { ok: true, message: "방해 금지 시간이 저장됐어요." };
}
