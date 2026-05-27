import { redirect } from "next/navigation";

import { TabBar } from "@/components/common/tab-bar";
import { ensureUserRow } from "@/lib/auth/dal";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // verifySession() runs inside ensureUserRow() and redirects to /login if unauthed.
  const user = await ensureUserRow();
  if (!user.onboardedAt) redirect("/onboarding");

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-background pb-20">
      <div className="flex-1">{children}</div>
      <TabBar />
    </div>
  );
}
