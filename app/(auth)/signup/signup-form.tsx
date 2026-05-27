"use client";

import { useActionState } from "react";

import { signup } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SignupForm() {
  const [state, action, pending] = useActionState(signup, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">이름</Label>
        <Input
          id="name"
          name="name"
          autoComplete="name"
          placeholder="형진"
          required
        />
        {state?.errors?.name?.[0] && (
          <p className="text-xs text-pink">{state.errors.name[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">이메일</Label>
        <Input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
        />
        {state?.errors?.email?.[0] && (
          <p className="text-xs text-pink">{state.errors.email[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">비밀번호</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="영문+숫자 8자 이상"
          required
        />
        {state?.errors?.password?.[0] && (
          <p className="text-xs text-pink">{state.errors.password[0]}</p>
        )}
      </div>

      {state?.message && (
        <p className="rounded-2xl bg-bg-mint px-4 py-3 text-xs text-foreground">
          {state.message}
        </p>
      )}

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "가입 중..." : "가입하기"}
      </Button>
    </form>
  );
}
