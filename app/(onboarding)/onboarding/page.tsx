import { redirect } from "next/navigation";

import { ensureUserRow, verifySession } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";

import { OnboardingForm } from "./onboarding-form";

export const metadata = { title: "환영해요 · LifeOS" };

export default async function OnboardingPage() {
  await ensureUserRow();
  const session = await verifySession();

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      name: true,
      height: true,
      weight: true,
      assistantName: true,
      assistantTone: true,
      onboardedAt: true,
    },
  });

  // Already onboarded → straight to home.
  if (user?.onboardedAt) redirect("/home");

  return (
    <main className="flex flex-1 flex-col gap-6 px-6 py-10">
      <OnboardingForm
        defaults={{
          name: user?.name ?? "",
          height: user?.height ?? null,
          weight: user?.weight ?? null,
          assistantName: user?.assistantName ?? "나비",
          assistantTone: user?.assistantTone ?? "FRIENDLY",
        }}
      />
    </main>
  );
}
