import Link from "next/link";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { getActivePartnership } from "@/lib/data/partnership";
import { verifySession } from "@/lib/auth/dal";

export const metadata = { title: "고마워 · LifeOS" };

export default async function ThanksPage() {
  const session = await verifySession();
  const partnership = await getActivePartnership();
  if (!partnership) {
    return (
      <main className="px-6 pt-10">
        <Card className="text-center text-sm text-foreground-muted">
          파트너십이 필요해요.
        </Card>
      </main>
    );
  }

  const thanks = await prisma.thankYou.findMany({
    where: { partnershipId: partnership.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const sent = thanks.filter((t) => t.fromUserId === session.userId).length;
  const received = thanks.filter((t) => t.toUserId === session.userId).length;

  return (
    <main className="flex flex-col gap-6 px-6 pt-10">
      <header>
        <Link href="/shared" className="text-foreground-muted text-xs">
          ‹ 우리
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">💌 고마워</h1>
      </header>

      <div className="grid grid-cols-2 gap-2">
        <Tile label="보낸 감사" value={`${sent}건`} accent="bg-bg-pink" />
        <Tile label="받은 감사" value={`${received}건`} accent="bg-bg-mint" />
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">최근 메시지</h2>
        {thanks.length === 0 ? (
          <Card className="text-center text-sm text-foreground-muted">
            아직 주고받은 감사가 없어요.
            <br />
            가사 완료 옆 💌 버튼을 눌러보세요.
          </Card>
        ) : (
          <ul className="flex flex-col gap-2">
            {thanks.map((t) => {
              const fromMe = t.fromUserId === session.userId;
              return (
                <li
                  key={t.id}
                  className={`flex items-center gap-3 rounded-card px-4 py-3 shadow-card ${fromMe ? "bg-bg-pink" : "bg-surface"}`}
                >
                  <span className="text-lg">💌</span>
                  <div className="flex flex-1 flex-col">
                    <span className="text-sm">{t.message}</span>
                    <span className="text-[11px] text-foreground-muted">
                      {fromMe ? "내가 보냄" : "내가 받음"} ·{" "}
                      {format(t.createdAt, "M월 d일 HH:mm", { locale: ko })}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}

function Tile({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className={`flex flex-col items-center gap-1 rounded-card ${accent} py-4`}>
      <span className="text-xs text-foreground-muted">{label}</span>
      <span className="text-lg font-bold">{value}</span>
    </div>
  );
}
