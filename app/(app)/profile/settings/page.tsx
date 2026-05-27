import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { logout } from "@/app/(auth)/actions";
import { verifySession } from "@/lib/auth/dal";
import { getActivePartnership } from "@/lib/data/partnership";

import { ExportButton } from "./_components/export-button";

export const metadata = { title: "설정 · LifeOS" };

export default async function SettingsPage() {
  await verifySession();
  const partnership = await getActivePartnership();

  return (
    <main className="flex flex-col gap-6 px-6 pt-10 pb-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">⚙️ 설정</h1>
        <Button asChild size="sm" variant="ghost">
          <Link href="/profile">‹ 뒤로</Link>
        </Button>
      </header>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-foreground-muted">개인화</h2>
        <Row href="/profile/edit" emoji="👤" title="프로필 / 신체 정보" />
        <Row href="/profile/assistant" emoji="🤖" title="AI 비서 커스텀" />
        <Row href="/profile/notifications" emoji="🔔" title="알림 · 방해 금지" />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-foreground-muted">파트너십</h2>
        {partnership ? (
          <Row
            href="/shared"
            emoji="👥"
            title="우리 관계 보기"
            hint={
              partnership.partner?.name
                ? `${partnership.partner.name}와 함께`
                : "활성"
            }
          />
        ) : (
          <Row href="/shared" emoji="✨" title="파트너 초대 / 참여" />
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-foreground-muted">데이터</h2>
        <Card>
          <CardTitle className="text-sm">내 데이터 내보내기</CardTitle>
          <CardDescription className="mt-1 mb-3">
            언제든 내 모든 기록을 JSON 파일로 다운로드할 수 있어요.
          </CardDescription>
          <ExportButton />
        </Card>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-foreground-muted">앱 정보</h2>
        <Card>
          <div className="flex justify-between text-xs">
            <span className="text-foreground-muted">버전</span>
            <span className="text-foreground">v0.1.0 (MVP)</span>
          </div>
        </Card>
      </section>

      <form action={logout} className="flex justify-center pt-2">
        <Button type="submit" variant="ghost" size="sm">
          로그아웃
        </Button>
      </form>
    </main>
  );
}

function Row({
  href,
  emoji,
  title,
  hint,
}: {
  href: string;
  emoji: string;
  title: string;
  hint?: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-2xl bg-surface px-4 py-3 shadow-card hover:bg-bg-lavender/30"
    >
      <span className="text-lg">{emoji}</span>
      <div className="flex flex-1 flex-col">
        <span className="text-sm font-medium">{title}</span>
        {hint && <span className="text-[11px] text-foreground-weak">{hint}</span>}
      </div>
      <span className="text-foreground-weak">›</span>
    </Link>
  );
}
