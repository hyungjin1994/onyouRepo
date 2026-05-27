import Link from "next/link";

import { SignupForm } from "./signup-form";

export const metadata = { title: "회원가입 · LifeOS" };

export default function SignupPage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col items-center gap-2 text-center">
        <span className="text-3xl">🌱</span>
        <h1 className="text-2xl font-bold tracking-tight">LifeOS 시작하기</h1>
        <p className="text-sm text-foreground-muted">
          작은 변화부터 함께해요
        </p>
      </header>

      <SignupForm />

      <p className="text-center text-xs text-foreground-muted">
        이미 계정이 있어요?{" "}
        <Link href="/login" className="font-medium text-lavender">
          로그인
        </Link>
      </p>
    </div>
  );
}
