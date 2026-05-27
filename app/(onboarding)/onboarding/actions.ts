"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { AssistantTone } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth/dal";

const OnboardingSchema = z.object({
  name: z.string().min(1, "이름을 입력해주세요").max(20).trim(),
  height: z.preprocess(
    (v) => (v === "" || v === null ? null : Number(v)),
    z.number().min(50).max(250).nullable(),
  ),
  weight: z.preprocess(
    (v) => (v === "" || v === null ? null : Number(v)),
    z.number().min(20).max(300).nullable(),
  ),
  assistantName: z.string().min(1, "비서 이름을 입력해주세요").max(20).trim(),
  assistantTone: z.enum(AssistantTone),
});

export type OnboardingFormState =
  | { errors?: Record<string, string[]>; message?: string }
  | undefined;

export async function completeOnboarding(
  _state: OnboardingFormState,
  formData: FormData,
): Promise<OnboardingFormState> {
  const session = await verifySession();

  const parsed = OnboardingSchema.safeParse({
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
    data: { ...parsed.data, onboardedAt: new Date() },
  });

  revalidatePath("/home");
  revalidatePath("/profile");
  redirect("/home");
}
