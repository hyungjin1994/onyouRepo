import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth/dal";
import { EditProfileForm } from "./edit-profile-form";

export const metadata = { title: "프로필 수정 · LifeOS" };

export default async function EditProfilePage() {
  const session = await verifySession();
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  });
  if (!user) notFound();

  return (
    <main className="flex flex-col gap-6 px-6 pt-10 pb-12">
      <header className="flex items-center gap-3">
        <Link href="/profile" className="text-foreground-muted">
          ‹
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">프로필 수정</h1>
      </header>

      <EditProfileForm
        defaults={{
          name: user.name ?? "",
          height: user.height,
          weight: user.weight,
          assistantName: user.assistantName,
          assistantTone: user.assistantTone,
        }}
      />
    </main>
  );
}
