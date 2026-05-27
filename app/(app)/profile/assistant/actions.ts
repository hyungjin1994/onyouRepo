"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { AssistantTone } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth/dal";

const AssistantSchema = z.object({
  assistantName: z.string().min(1, "이름을 입력해주세요").max(20).trim(),
  assistantTone: z.enum(AssistantTone),
});

export type AssistantFormState =
  | { errors?: Record<string, string[]>; message?: string }
  | undefined;

export async function updateAssistant(
  _state: AssistantFormState,
  formData: FormData,
): Promise<AssistantFormState> {
  const session = await verifySession();

  const parsed = AssistantSchema.safeParse({
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
  revalidatePath("/chat");
  revalidatePath("/home");
  redirect("/profile");
}
