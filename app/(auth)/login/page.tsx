import Link from "next/link";

import { LoginForm } from "./login-form";

export const metadata = { title: "로그인 · LifeOS" };

export default function LoginPage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col items-center gap-2 text-center">
        <span className="text-3xl">🌱</span>
        <h1 className="text-2xl font-bold tracking-tight">LifeOS</h1>
        <p className="text-sm text-foreground-muted">
          나의 하루를 설계하는 AI 비서
        </p>
      </header>

      <LoginForm />

      <p className="text-center text-xs text-foreground-muted">
        아직 계정이 없어요?{" "}
        <Link href="/signup" className="font-medium text-lavender">
          가입하기
        </Link>
      </p>
    </div>
  );
}
