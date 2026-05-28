import Link from "next/link";
import { notFound } from "next/navigation";

import { Card } from "@/components/ui/card";
import { verifySession } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { getActivePartnership } from "@/lib/data/partnership";

import { EditChoreForm } from "./edit-chore-form";

export const metadata = { title: "가사 수정 · LifeOS" };

export default async function EditChorePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await verifySession();
  const partnership = await getActivePartnership();
  const { id } = await params;

  if (!partnership || !partnership.partnerId) {
    return (
      <main className="px-6 pt-10">
        <Card className="text-center text-sm text-foreground-muted">
          파트너십이 필요해요.
        </Card>
      </main>
    );
  }

  const chore = await prisma.chore.findFirst({
    where: { id, partnershipId: partnership.id },
  });
  if (!chore) notFound();

  const ownerLabel =
    partnership.ownerId === session.userId ? "나" : partnership.owner.name ?? "A";
  const partnerLabel =
    partnership.partnerId === session.userId
      ? "나"
      : partnership.partner?.name ?? "B";

  return (
    <main className="flex flex-col gap-6 px-6 pt-10 pb-12">
      <header className="flex items-center gap-3">
        <Link href="/shared/chores" className="text-foreground-muted">
          ‹
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">가사 수정</h1>
      </header>

      <EditChoreForm
        choreId={chore.id}
        defaults={{
          title: chore.title,
          emoji: chore.emoji ?? "🧹",
          frequency: chore.frequency,
          daysOfWeek: chore.daysOfWeek,
          assignmentType: chore.assignmentType,
          fixedAssigneeId: chore.fixedAssigneeId,
          estimatedTime: chore.estimatedTime,
        }}
        members={[
          { id: partnership.ownerId, label: ownerLabel },
          { id: partnership.partnerId, label: partnerLabel },
        ]}
      />
    </main>
  );
}
