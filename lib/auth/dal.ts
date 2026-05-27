import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

/**
 * Verify the Supabase session and return the auth user.
 * Memoized per render via React `cache`.
 */
export const verifySession = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return { userId: user.id, email: user.email!, authUser: user };
});

/**
 * Ensure a Prisma `User` row exists for the authenticated Supabase user.
 * Called from the home page after first sign-in to set up the profile row.
 */
export const ensureUserRow = cache(async () => {
  const session = await verifySession();

  return prisma.user.upsert({
    where: { id: session.userId },
    update: {},
    create: {
      id: session.userId,
      email: session.email,
      name:
        (session.authUser.user_metadata?.name as string | undefined) ?? null,
    },
  });
});
