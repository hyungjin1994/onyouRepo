"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomBytes } from "node:crypto";

import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth/dal";

function makeCode() {
  // 8-char base32-ish — easy to read & type
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(8);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

export async function createInvite() {
  const session = await verifySession();

  // If the user already has any partnership (active or pending), bail.
  const existing = await prisma.partnership.findFirst({
    where: {
      OR: [{ ownerId: session.userId }, { partnerId: session.userId }],
    },
  });
  if (existing) {
    revalidatePath("/shared");
    return;
  }

  // Generate a unique 8-char invite code (retry on collision).
  let code = makeCode();
  for (let i = 0; i < 5; i++) {
    const dup = await prisma.partnership.findUnique({
      where: { inviteCode: code },
    });
    if (!dup) break;
    code = makeCode();
  }

  await prisma.partnership.create({
    data: {
      ownerId: session.userId,
      inviteCode: code,
      status: "PENDING",
    },
  });

  revalidatePath("/shared");
}

export async function cancelInvite() {
  const session = await verifySession();
  await prisma.partnership.deleteMany({
    where: { ownerId: session.userId, status: "PENDING" },
  });
  revalidatePath("/shared");
}

export type JoinFormState =
  | { error?: string; ok?: boolean }
  | undefined;

export async function joinPartnership(
  _state: JoinFormState,
  formData: FormData,
): Promise<JoinFormState> {
  const session = await verifySession();
  const code = String(formData.get("code") ?? "")
    .trim()
    .toUpperCase();

  if (!code) return { error: "초대 코드를 입력해주세요." };

  const partnership = await prisma.partnership.findUnique({
    where: { inviteCode: code },
  });
  if (!partnership) return { error: "올바르지 않은 코드예요." };
  if (partnership.status !== "PENDING") {
    return { error: "이미 사용된 코드예요." };
  }
  if (partnership.ownerId === session.userId) {
    return { error: "자신이 만든 코드로는 참여할 수 없어요." };
  }

  // Block if user already has any partnership.
  const existing = await prisma.partnership.findFirst({
    where: {
      status: { in: ["ACTIVE", "PENDING"] },
      OR: [{ ownerId: session.userId }, { partnerId: session.userId }],
    },
  });
  if (existing) {
    return { error: "이미 다른 파트너십이 있어요." };
  }

  await prisma.partnership.update({
    where: { id: partnership.id },
    data: {
      partnerId: session.userId,
      status: "ACTIVE",
      startedAt: new Date(),
    },
  });

  revalidatePath("/shared");
  redirect("/shared");
}

export async function leavePartnership() {
  const session = await verifySession();
  await prisma.partnership.updateMany({
    where: {
      status: "ACTIVE",
      OR: [{ ownerId: session.userId }, { partnerId: session.userId }],
    },
    data: { status: "PAUSED" },
  });
  revalidatePath("/shared");
}
