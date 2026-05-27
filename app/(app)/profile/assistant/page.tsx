import Link from "next/link";

import { Button } from "@/components/ui/button";
import { verifySession } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";

import { AssistantForm } from "./assistant-form";

export const metadata = { title: "비서 커스텀 · LifeOS" };

export default async function AssistantSettingsPage() {
  const session = await verifySession();
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { assistantName: true, assistantTone: true },
  });

  return (
    <main className="flex flex-col gap-6 px-6 pt-10">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">🤖 비서 커스텀</h1>
        <Button asChild size="sm" variant="ghost">
          <Link href="/profile">‹ 뒤로</Link>
        </Button>
      </header>

      <p className="text-sm text-foreground-muted">
        비서의 이름과 말투를 바꿔보세요. 미리보기로 어떤 느낌인지 확인할 수 있어요.
      </p>

      <AssistantForm
        defaults={{
          assistantName: user?.assistantName ?? "나비",
          assistantTone: user?.assistantTone ?? "FRIENDLY",
        }}
      />
    </main>
  );
}
