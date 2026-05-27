"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function ExportButton() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const download = async () => {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/export");
      if (!res.ok) throw new Error("내보내기에 실패했어요");
      const blob = await res.blob();

      // Prefer the filename the server suggested; fall back to a sane default.
      const disposition = res.headers.get("content-disposition") ?? "";
      const match = /filename="?([^"]+)"?/i.exec(disposition);
      const filename = match?.[1] ?? "lifeos-export.json";

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "알 수 없는 오류");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Button onClick={download} disabled={pending} size="md" variant="soft">
        {pending ? "준비 중..." : "📦 JSON으로 내보내기"}
      </Button>
      {error && <p className="text-xs text-pink">{error}</p>}
      <p className="text-[11px] text-foreground-weak">
        일정, 루틴, 운동 기록, 몸무게, AI 채팅 기록이 포함돼요.
        공동 데이터(가사·장보기·가계부)는 별도로 관리돼서 제외돼요.
      </p>
    </div>
  );
}
