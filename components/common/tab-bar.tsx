"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const tabs = [
  { href: "/home", label: "홈", emoji: "🏠" },
  { href: "/calendar", label: "캘린더", emoji: "📅" },
  { href: "/routines", label: "루틴", emoji: "✓" },
  { href: "/workout", label: "운동", emoji: "💪" },
  { href: "/shared", label: "우리", emoji: "👥" },
  { href: "/profile", label: "MY", emoji: "👤" },
] as const;

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 backdrop-blur">
      <ul className="mx-auto flex max-w-md items-stretch justify-between px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-1">
        {tabs.map(({ href, label, emoji }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 rounded-2xl px-1 py-2 text-[10px] transition-colors",
                  active
                    ? "text-foreground"
                    : "text-foreground-weak hover:text-foreground-muted",
                )}
              >
                <span className="text-lg leading-none">{emoji}</span>
                <span className={cn(active && "font-medium")}>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
