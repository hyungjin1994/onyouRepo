import "server-only";

import webpush from "web-push";
import { InteractionType } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getVapidConfig } from "@/lib/push/vapid";
import { isWithinDnd } from "@/lib/push/dnd";

export type PushPayload = {
  title: string;
  body: string;
  url?: string;        // open-this-url on click
  tag?: string;        // dedupe key
  icon?: string;
  badge?: string;
  data?: Record<string, unknown>;
};

export type SendOptions = {
  ignoreDnd?: boolean;
  /** When set, record an AIInteraction row so the notification appears in 알림 센터. */
  logType?: InteractionType;
};

let configured = false;

function ensureConfigured() {
  if (configured) return true;
  const cfg = getVapidConfig();
  if (!cfg) return false;
  webpush.setVapidDetails(cfg.subject, cfg.publicKey, cfg.privateKey);
  configured = true;
  return true;
}

/**
 * Send a notification to all of a user's active subscriptions.
 * Skips silently if push isn't configured or the user is within DND.
 * Prunes 404/410 subscriptions automatically.
 */
export async function sendPushToUser(
  userId: string,
  payload: PushPayload,
  options: SendOptions = {},
) {
  if (!ensureConfigured()) return { sent: 0, skipped: 0, reason: "no-vapid" };

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      pushEnabled: true,
      dndStart: true,
      dndEnd: true,
      timezone: true,
      pushSubscriptions: { select: { id: true, endpoint: true, p256dh: true, auth: true } },
    },
  });
  if (!user || !user.pushEnabled) return { sent: 0, skipped: 0, reason: "disabled" };

  if (!options.ignoreDnd && isWithinDnd(new Date(), user.dndStart, user.dndEnd, user.timezone)) {
    return { sent: 0, skipped: user.pushSubscriptions.length, reason: "dnd" };
  }

  const body = JSON.stringify(payload);
  const expired: string[] = [];
  let sent = 0;

  await Promise.all(
    user.pushSubscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          body,
        );
        sent += 1;
      } catch (err: unknown) {
        const status = (err as { statusCode?: number })?.statusCode;
        if (status === 404 || status === 410) expired.push(sub.id);
      }
    }),
  );

  if (expired.length) {
    await prisma.pushSubscription.deleteMany({ where: { id: { in: expired } } });
  }

  if (sent > 0 && options.logType) {
    await prisma.aIInteraction.create({
      data: {
        userId,
        type: options.logType,
        content: payload.title,
        response: payload.body,
      },
    });
  }

  return { sent, skipped: 0, expired: expired.length };
}
