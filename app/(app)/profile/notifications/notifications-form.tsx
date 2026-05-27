"use client";

import { useActionState, useEffect, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { updateDnd } from "./actions";

type Defaults = {
  pushEnabled: boolean;
  dndStart: string;
  dndEnd: string;
  deviceCount: number;
};

type Props = {
  publicKey: string;
  configured: boolean;
  defaults: Defaults;
};

type PushStatus =
  | "checking"
  | "unsupported"
  | "denied"
  | "off"
  | "on"
  | "working";

export function NotificationsForm({ publicKey, configured, defaults }: Props) {
  const [status, setStatus] = useState<PushStatus>("checking");
  const [deviceCount, setDeviceCount] = useState(defaults.deviceCount);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [dndState, dndAction, dndPending] = useActionState(updateDnd, undefined);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }

    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }

    navigator.serviceWorker
      .getRegistration()
      .then(async (reg) => {
        const sub = await reg?.pushManager.getSubscription();
        setStatus(sub && defaults.pushEnabled ? "on" : "off");
      })
      .catch(() => setStatus("off"));
  }, [defaults.pushEnabled]);

  const subscribe = async () => {
    setError(null);
    setStatus("working");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "off");
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      if (existing) await existing.unsubscribe();

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      if (!res.ok) throw new Error("구독 저장에 실패했어요");

      setDeviceCount((c) => c + 1);
      setStatus("on");
      startTransition(() => {});
    } catch (e) {
      setError(e instanceof Error ? e.message : "알림 등록 실패");
      setStatus("off");
    }
  };

  const unsubscribe = async () => {
    setError(null);
    setStatus("working");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      const endpoint = sub?.endpoint;
      if (sub) await sub.unsubscribe();

      const url = endpoint
        ? `/api/push/subscribe?endpoint=${encodeURIComponent(endpoint)}`
        : "/api/push/subscribe";
      await fetch(url, { method: "DELETE" });

      setDeviceCount(0);
      setStatus("off");
    } catch (e) {
      setError(e instanceof Error ? e.message : "구독 해제 실패");
      setStatus("on");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle>푸시 알림</CardTitle>
            <CardDescription className="mt-1">
              {pushDescription(status, deviceCount)}
            </CardDescription>
          </div>
          {renderToggleButton({ status, configured, subscribe, unsubscribe })}
        </div>
        {error && <p className="mt-3 text-xs text-pink">{error}</p>}
      </Card>

      <form action={dndAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-medium text-foreground-muted">방해 금지 시간</h2>
          <p className="text-xs text-foreground-weak">
            이 시간 동안 푸시 알림이 보내지지 않아요.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dndStart">시작</Label>
            <Input
              id="dndStart"
              type="time"
              name="dndStart"
              required
              defaultValue={defaults.dndStart}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dndEnd">종료</Label>
            <Input
              id="dndEnd"
              type="time"
              name="dndEnd"
              required
              defaultValue={defaults.dndEnd}
            />
          </div>
        </div>

        {dndState?.errors?.dndStart?.[0] && (
          <p className="text-xs text-pink">{dndState.errors.dndStart[0]}</p>
        )}
        {dndState?.errors?.dndEnd?.[0] && (
          <p className="text-xs text-pink">{dndState.errors.dndEnd[0]}</p>
        )}
        {dndState?.ok && (
          <p className="rounded-2xl bg-bg-mint px-4 py-3 text-xs text-foreground">
            {dndState.message}
          </p>
        )}

        <Button type="submit" size="lg" disabled={dndPending}>
          {dndPending ? "저장 중..." : "방해 금지 시간 저장"}
        </Button>
      </form>
    </div>
  );
}

function renderToggleButton(args: {
  status: PushStatus;
  configured: boolean;
  subscribe: () => void;
  unsubscribe: () => void;
}) {
  const { status, configured, subscribe, unsubscribe } = args;

  if (!configured || status === "unsupported" || status === "denied" || status === "checking") {
    return (
      <Button size="sm" variant="soft" disabled>
        {status === "checking" ? "확인 중..." : "사용 불가"}
      </Button>
    );
  }
  if (status === "working") {
    return (
      <Button size="sm" variant="soft" disabled>
        처리 중...
      </Button>
    );
  }
  if (status === "on") {
    return (
      <Button size="sm" variant="outline" onClick={unsubscribe}>
        끄기
      </Button>
    );
  }
  return (
    <Button size="sm" onClick={subscribe}>
      켜기
    </Button>
  );
}

function pushDescription(status: PushStatus, deviceCount: number) {
  switch (status) {
    case "checking":
      return "상태를 확인하고 있어요...";
    case "unsupported":
      return "이 브라우저는 푸시 알림을 지원하지 않아요. iOS는 16.4+ 홈화면 추가 후 사용 가능해요.";
    case "denied":
      return "브라우저 알림 권한이 차단되어 있어요. 브라우저 설정에서 허용해주세요.";
    case "on":
      return deviceCount > 0
        ? `${deviceCount}개 기기에서 알림을 받고 있어요.`
        : "이 기기에서 알림이 켜져 있어요.";
    case "off":
      return "지금은 알림을 받지 않아요.";
    case "working":
      return "잠시만요...";
  }
}

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(normalized);
  const buffer = new ArrayBuffer(raw.length);
  const output = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}
