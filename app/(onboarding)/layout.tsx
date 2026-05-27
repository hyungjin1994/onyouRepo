// Standalone layout for onboarding — no tab bar, no profile-row guarantee
// (the user is mid-setup, so ensureUserRow happens inside the page itself).
export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-background">
      {children}
    </div>
  );
}
