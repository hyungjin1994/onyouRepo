"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function InviteCard({
  code,
  createdAt,
}: {
  code: string;
  createdAt: Date | string;
}) {
  const [copied, setCopied] = useState(false);
  const createdAtDate = typeof createdAt === "string" ? new Date(createdAt) : createdAt;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <Card className="bg-bg-lavender">
      <p className="text-xs text-foreground-muted">초대 코드</p>
      <p className="mt-2 font-mono text-3xl font-bold tracking-[0.3em]">
        {code}
      </p>
      <p className="mt-3 text-[11px] text-foreground-muted">
        파트너가 이 코드를 입력하면 함께 시작해요.
        <br />
        만든 시각: {format(createdAtDate, "M월 d일 HH:mm", { locale: ko })}
      </p>
      <Button
        type="button"
        size="sm"
        variant="soft"
        onClick={copy}
        className="mt-4 self-start"
      >
        {copied ? "✓ 복사됨" : "📋 복사하기"}
      </Button>
    </Card>
  );
}
