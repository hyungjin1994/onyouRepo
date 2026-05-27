import Link from "next/link";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { verifySession } from "@/lib/auth/dal";
import { getActivePartnership } from "@/lib/data/partnership";

import { NewExpenseForm } from "./new-expense-form";

export const metadata = { title: "지출 추가 · LifeOS" };

export default async function NewExpensePage() {
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

  const today = format(new Date(), "yyyy-MM-dd");
  const ownerLabel =
    partnership.ownerId === session.userId ? "나" : partnership.owner.name ?? "A";
  const partnerLabel =
    partnership.partnerId === session.userId
      ? "나"
      : partnership.partner?.name ?? "B";

  return (
    <main className="flex flex-col gap-6 px-6 pt-10 pb-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">💰 지출 추가</h1>
        <Button asChild size="sm" variant="ghost">
          <Link href="/shared/budget">‹ 뒤로</Link>
        </Button>
      </header>

      <NewExpenseForm
        today={today}
        currentUserId={session.userId}
        payers={[
          { id: partnership.ownerId, label: ownerLabel },
          { id: partnership.partnerId, label: partnerLabel },
        ]}
      />
    </main>
  );
}
