import "server-only";

import { cache } from "react";
import { subDays, startOfDay } from "date-fns";
import { ShoppingCategory } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getActivePartnership } from "@/lib/data/partnership";

export type FrequentItem = {
  name: string;
  count: number;
  category: ShoppingCategory | null;
  lastQuantity: string | null;
};

/**
 * Items the household tends to buy, based on purchase history.
 *  - Looks at completed purchases in the last `lookbackDays` (default 90)
 *  - Groups by name (case-insensitive, trimmed)
 *  - Filters to anything bought ≥ 2 times
 *  - Excludes items currently sitting in the active (unpurchased) list,
 *    so we never recommend something the user already has queued up.
 */
export const getFrequentlyBought = cache(
  async (lookbackDays = 90, limit = 10): Promise<FrequentItem[]> => {
    const partnership = await getActivePartnership();
    if (!partnership) return [];

    const since = subDays(startOfDay(new Date()), lookbackDays);

    const [purchased, currentUnpurchased] = await Promise.all([
      prisma.shoppingItem.findMany({
        where: {
          partnershipId: partnership.id,
          purchased: true,
          purchasedAt: { not: null, gte: since },
        },
        select: {
          name: true,
          category: true,
          quantity: true,
          purchasedAt: true,
        },
        orderBy: { purchasedAt: "desc" },
      }),
      prisma.shoppingItem.findMany({
        where: { partnershipId: partnership.id, purchased: false },
        select: { name: true },
      }),
    ]);

    const onListKeys = new Set(currentUnpurchased.map((i) => normalize(i.name)));

    const byKey = new Map<string, FrequentItem & { displayName: string }>();
    for (const row of purchased) {
      const key = normalize(row.name);
      if (onListKeys.has(key)) continue;
      const existing = byKey.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        byKey.set(key, {
          name: key,
          displayName: row.name.trim(),
          count: 1,
          category: row.category,
          lastQuantity: row.quantity,
        });
      }
    }

    return Array.from(byKey.values())
      .filter((row) => row.count >= 2)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map(({ displayName, count, category, lastQuantity }) => ({
        name: displayName,
        count,
        category,
        lastQuantity,
      }));
  },
);

function normalize(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}
