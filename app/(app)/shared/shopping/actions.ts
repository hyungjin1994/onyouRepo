"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ShoppingCategory } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth/dal";
import { getActivePartnership } from "@/lib/data/partnership";

const ItemInputSchema = z.object({
  name: z.string().min(1).max(80).trim(),
  quantity: z.string().max(40).optional().nullable(),
  category: z.enum(ShoppingCategory).optional().nullable(),
  note: z.string().max(200).optional().nullable(),
});

export type ShoppingFormState =
  | { errors?: Record<string, string[]>; message?: string }
  | undefined;

export async function addShoppingItem(
  _state: ShoppingFormState,
  formData: FormData,
): Promise<ShoppingFormState> {
  const session = await verifySession();
  const partnership = await getActivePartnership();
  if (!partnership) return { message: "파트너십이 필요해요." };

  const parsed = ItemInputSchema.safeParse({
    name: formData.get("name"),
    quantity: formData.get("quantity") || null,
    category: formData.get("category") || null,
    note: formData.get("note") || null,
  });

  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors };
  }

  await prisma.shoppingItem.create({
    data: {
      partnershipId: partnership.id,
      name: parsed.data.name,
      quantity: parsed.data.quantity ?? null,
      category: parsed.data.category ?? null,
      note: parsed.data.note ?? null,
      addedById: session.userId,
    },
  });

  revalidatePath("/shared/shopping");
  revalidatePath("/shared");
  return { errors: {} };
}

export async function togglePurchased(itemId: string) {
  const session = await verifySession();
  const partnership = await getActivePartnership();
  if (!partnership) return;

  const item = await prisma.shoppingItem.findFirst({
    where: { id: itemId, partnershipId: partnership.id },
  });
  if (!item) return;

  await prisma.shoppingItem.update({
    where: { id: itemId },
    data: item.purchased
      ? { purchased: false, purchasedAt: null, purchasedById: null }
      : {
          purchased: true,
          purchasedAt: new Date(),
          purchasedById: session.userId,
        },
  });

  revalidatePath("/shared/shopping");
  revalidatePath("/shared");
}

export async function deleteShoppingItem(itemId: string) {
  const partnership = await getActivePartnership();
  if (!partnership) return;
  await prisma.shoppingItem.deleteMany({
    where: { id: itemId, partnershipId: partnership.id },
  });
  revalidatePath("/shared/shopping");
  revalidatePath("/shared");
}

/**
 * One-tap add from the "자주 사는 것" suggestion chips.
 * Skips silently if the same name is already on the unpurchased list.
 */
export async function addSuggestedItem(formData: FormData) {
  const session = await verifySession();
  const partnership = await getActivePartnership();
  if (!partnership) return;

  const name = ((formData.get("name") as string) ?? "").trim();
  if (!name) return;

  const category = (formData.get("category") as ShoppingCategory | "") || null;
  const quantity = ((formData.get("quantity") as string) ?? "").trim() || null;

  const dupe = await prisma.shoppingItem.findFirst({
    where: {
      partnershipId: partnership.id,
      purchased: false,
      name: { equals: name, mode: "insensitive" },
    },
    select: { id: true },
  });
  if (dupe) {
    revalidatePath("/shared/shopping");
    return;
  }

  await prisma.shoppingItem.create({
    data: {
      partnershipId: partnership.id,
      name,
      category: category as ShoppingCategory | null,
      quantity,
      addedById: session.userId,
    },
  });

  revalidatePath("/shared/shopping");
  revalidatePath("/shared");
}

export async function clearPurchased() {
  const partnership = await getActivePartnership();
  if (!partnership) return;
  await prisma.shoppingItem.deleteMany({
    where: { partnershipId: partnership.id, purchased: true },
  });
  revalidatePath("/shared/shopping");
  revalidatePath("/shared");
}
