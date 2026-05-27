import "server-only";

import { cache } from "react";

import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth/dal";

/**
 * Active partnership for the current user (as owner or partner).
 * Returns null if the user has no accepted partnership yet.
 */
export const getActivePartnership = cache(async () => {
  const session = await verifySession();
  return prisma.partnership.findFirst({
    where: {
      status: "ACTIVE",
      OR: [{ ownerId: session.userId }, { partnerId: session.userId }],
    },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      partner: { select: { id: true, name: true, email: true } },
    },
  });
});

/**
 * Any partnership row owned by the current user — used to surface a pending invite
 * to the inviter on the /shared landing.
 */
export const getMyPendingInvite = cache(async () => {
  const session = await verifySession();
  return prisma.partnership.findFirst({
    where: { ownerId: session.userId, status: "PENDING" },
  });
});

export async function requirePartnership(userId: string) {
  const partnership = await prisma.partnership.findFirst({
    where: {
      status: "ACTIVE",
      OR: [{ ownerId: userId }, { partnerId: userId }],
    },
  });
  if (!partnership) throw new Error("active partnership required");
  return partnership;
}

/**
 * Helper: pick "the other person" given a partnership and the current user.
 */
export function counterpartUserId(
  partnership: { ownerId: string; partnerId: string | null },
  currentUserId: string,
) {
  return partnership.ownerId === currentUserId
    ? partnership.partnerId
    : partnership.ownerId;
}
