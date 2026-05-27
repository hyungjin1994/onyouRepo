import Link from "next/link";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/home");

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-10 px-6 py-12">
      <header className="flex flex-col items-center gap-3 text-center">
        <span className="text-5xl">🌱</span>
        <h1 className="text-3xl font-bold tracking-tight">LifeOS</h1>
        <p className="text-sm text-foreground-muted">
          나의 하루를 설계하는 AI 비서
          <br />
          작은 변화부터, 함께라서 더 즐거운
        </p>
      </header>

      <div className="flex w-full flex-col gap-3">
        <Button asChild size="lg">
          <Link href="/signup">시작하기</Link>
        </Button>
        <Button asChild size="lg" variant="soft">
          <Link href="/login">로그인</Link>
        </Button>
      </div>
    </main>
  );
}
