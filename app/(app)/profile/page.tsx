import Link from "next/link";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { verifySession } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "MY · LifeOS" };

export default async function ProfilePage() {
  const session = await verifySession();
  const user = await prisma.user.findUnique({ where: { id: session.userId } });

  return (
    <main className="flex flex-col gap-6 px-6 pt-10">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">👤 MY</h1>
        <Button asChild size="sm" variant="soft">
          <Link href="/profile/edit">수정</Link>
        </Button>
      </header>

      <Card>
        <CardTitle>{user?.name ?? "이름을 설정해주세요"}</CardTitle>
        <CardDescription className="mt-1">{session.email}</CardDescription>

        <dl className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
          <Stat label="키" value={user?.height ? `${user.height}cm` : "—"} />
          <Stat label="몸무게" value={user?.weight ? `${user.weight}kg` : "—"} />
          <Stat
            label="BMI"
            value={
              user?.height && user?.weight
                ? (user.weight / (user.height / 100) ** 2).toFixed(1)
                : "—"
            }
          />
        </dl>
      </Card>

      <Card>
        <CardContent>
          <Row label="비서 이름">{user?.assistantName ?? "나비"}</Row>
          <Row label="비서 말투">{toneLabel(user?.assistantTone)}</Row>
          <Row label="가입일">
            {user?.createdAt ? format(user.createdAt, "yyyy.MM.dd") : "—"}
          </Row>
        </CardContent>
      </Card>

      <nav className="flex flex-col gap-2">
        <ProfileLink href="/profile/weight" emoji="⚖️" title="몸무게 변화" />
        <ProfileLink href="/insights" emoji="🧠" title="인사이트" />
        <ProfileLink href="/profile/settings" emoji="⚙️" title="설정 · 데이터 · 알림" />
      </nav>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-2xl bg-bg-lavender/60 py-3">
      <span className="text-foreground-weak">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between border-b border-border py-2 text-sm last:border-b-0">
      <span className="text-foreground-muted">{label}</span>
      <span>{children}</span>
    </div>
  );
}

function ProfileLink({
  href,
  emoji,
  title,
}: {
  href: string;
  emoji: string;
  title: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-2xl bg-surface px-4 py-3 shadow-card hover:bg-bg-lavender/30"
    >
      <span className="text-lg">{emoji}</span>
      <span className="flex-1 text-sm font-medium">{title}</span>
      <span className="text-foreground-weak">›</span>
    </Link>
  );
}

function toneLabel(tone?: string | null) {
  switch (tone) {
    case "POLITE":
      return "🎩 정중하게";
    case "FUN":
      return "🎉 재미있게";
    case "STRICT":
      return "💼 엄격하게";
    default:
      return "😊 친근하게";
  }
}
