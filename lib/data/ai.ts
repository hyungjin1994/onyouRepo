import "server-only";

import { cache } from "react";

import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth/dal";

export const getRecentChat = cache(async (limit = 40) => {
  const session = await verifySession();
  const rows = await prisma.aIInteraction.findMany({
    where: { userId: session.userId, type: "CHAT" },
    orderBy: { createdAt: "asc" },
    take: limit,
  });
  return rows;
});
