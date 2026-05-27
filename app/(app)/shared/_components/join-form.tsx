"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { joinPartnership } from "../actions";

export function JoinForm() {
  const [state, action, pending] = useActionState(joinPartnership, undefined);

  return (
    <form action={action} className="flex gap-2">
      <Input
        name="code"
        maxLength={8}
        placeholder="8자리 코드"
        autoCapitalize="characters"
        className="flex-1 font-mono tracking-[0.2em] uppercase"
        required
      />
      <Button type="submit" disabled={pending}>
        {pending ? "..." : "참여"}
      </Button>
      {state?.error && (
        <p className="absolute mt-12 text-xs text-pink">{state.error}</p>
      )}
    </form>
  );
}
