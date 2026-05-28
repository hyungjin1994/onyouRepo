import Link from "next/link";

import { Card } from "@/components/ui/card";
import { verifySession } from "@/lib/auth/dal";
import { getActivePartnership } from "@/lib/data/partnership";
import { CHORE_PRESETS } from "@/lib/chores";
import { NewChoreForm } from "./new-chore-form";

export const metadata = { title: "가사 추가 · LifeOS" };

export default async function NewChorePage() {
  const session = await verifySession();
  const partnership = await getActivePartnership();

  if (!partnership || !partnership.partnerId) {
    return (
      <main className="px-6 pt-10">
        <Card className="text-center text-sm text-foreground-muted">
          파트너십이 필요해요.
        </Card>
      </main>
    );
  }

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
        <h1 className="text-2xl font-bold tracking-tight">가사 추가</h1>
      </header>

      <NewChoreForm
        presets={CHORE_PRESETS}
        currentUserId={session.userId}
        members={[
          { id: partnership.ownerId, label: ownerLabel },
          { id: partnership.partnerId, label: partnerLabel },
        ]}
      />
    </main>
  );
}
