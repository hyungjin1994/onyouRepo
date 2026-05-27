"use client";

import { useState, useTransition } from "react";

import { sendThanks } from "../actions";

export function ThanksButton({
  toUserId,
  choreLogId,
}: {
  toUserId: string;
  choreLogId?: string;
}) {
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending || sent}
      onClick={() =>
        startTransition(async () => {
          await sendThanks(toUserId, choreLogId);
          setSent(true);
        })
      }
      className="shrink-0 rounded-full bg-bg-pink px-2 py-1 text-[10px] text-foreground hover:brightness-95 disabled:opacity-60"
    >
      {sent ? "💌 보냄" : "💌 고마워"}
    </button>
  );
}
