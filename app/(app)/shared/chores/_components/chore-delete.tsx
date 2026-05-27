"use client";

import { useTransition } from "react";

import { deleteChore } from "../actions";

export function ChoreDelete({ choreId }: { choreId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      onClick={() => {
        if (!confirm("이 가사를 삭제할까요?")) return;
        startTransition(() => deleteChore(choreId));
      }}
      disabled={pending}
      className="text-[11px] text-foreground-weak hover:text-pink disabled:opacity-50"
    >
      삭제
    </button>
  );
}
