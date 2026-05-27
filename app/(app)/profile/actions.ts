"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { AssistantTone } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth/dal";

const ProfileSchema = z.object({
  name: z.string().min(1).max(20).trim(),
  height: z.preprocess(
    (v) => (v === "" || v === null ? null : Number(v)),
    z.number().min(50).max(250).nullable(),
  ),
  weight: z.preprocess(
    (v) => (v === "" || v === null ? null : Number(v)),
    z.number().min(20).max(300).nullable(),
  ),
  assistantName: z.string().min(1).max(20).trim(),
  assistantTone: z.enum(AssistantTone),
});

export type ProfileFormState =
  | { errors?: Record<string, string[]>; message?: string }
  | undefined;

export async function updateProfile(
  _state: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const session = await verifySession();

  const parsed = ProfileSchema.safeParse({
    name: formData.get("name"),
    height: formData.get("height"),
    weight: formData.get("weight"),
    assistantName: formData.get("assistantName"),
    assistantTone: formData.get("assistantTone"),
  });

  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors };
  }

  await prisma.user.update({
    where: { id: session.userId },
    data: parsed.data,
  });

  revalidatePath("/profile");
  revalidatePath("/home");
  redirect("/profile");
}
