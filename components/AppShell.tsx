"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { AuthButton } from "@/components/AuthButton";

const navItems = [
  { href: "/", label: "Today" },
  { href: "/goals", label: "Goals" },
  { href: "/calendar", label: "Calendar" },
  { href: "/weekly-plan", label: "Weekly Plan" }
];

function GearIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
      <path d="M19.4 15a1.8 1.8 0 0 0 .36 1.98l.04.04a2.2 2.2 0 0 1-3.11 3.11l-.04-.04a1.8 1.8 0 0 0-1.98-.36 1.8 1.8 0 0 0-1.07 1.65V21.5a2.2 2.2 0 0 1-4.4 0v-.12a1.8 1.8 0 0 0-1.07-1.65 1.8 1.8 0 0 0-1.98.36l-.04.04a2.2 2.2 0 0 1-3.11-3.11l.04-.04A1.8 1.8 0 0 0 4.6 15a1.8 1.8 0 0 0-1.65-1.07H2.83a2.2 2.2 0 0 1 0-4.4h.12A1.8 1.8 0 0 0 4.6 8.46a1.8 1.8 0 0 0-.36-1.98l-.04-.04a2.2 2.2 0 0 1 3.11-3.11l.04.04a1.8 1.8 0 0 0 1.98.36A1.8 1.8 0 0 0 10.4 2.08V1.96a2.2 2.2 0 0 1 4.4 0v.12a1.8 1.8 0 0 0 1.07 1.65 1.8 1.8 0 0 0 1.98-.36l.04-.04A2.2 2.2 0 0 1 21 6.44l-.04.04a1.8 1.8 0 0 0-.36 1.98 1.8 1.8 0 0 0 1.65 1.07h.12a2.2 2.2 0 0 1 0 4.4h-.12A1.8 1.8 0 0 0 19.4 15Z" />
    </svg>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const settingsIsActive = pathname.startsWith("/settings");

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="border-b border-line bg-white/95">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Link href="/" className="text-lg font-semibold tracking-normal">
              DoWhatNow
            </Link>
            <Link
              href="/goals/new"
              className="inline-flex items-center justify-center rounded-md bg-leaf px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-ink focus:outline-none focus:ring-2 focus:ring-leaf focus:ring-offset-2 focus:ring-offset-2"
            >
              + Create goal
            </Link>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <nav className="flex gap-2 overflow-x-auto" aria-label="Main navigation">
              {navItems.map((item) => {
                const isActive =
                  item.href === "/" ? pathname === item.href : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`text-sm transition hover:text-ink focus:outline-none focus-visible:underline focus-visible:decoration-leaf focus-visible:underline-offset-4 ${
                      isActive
                        ? "font-semibold text-leaf"
                        : "font-medium text-ink/60"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <Link
                href="/settings"
                aria-label="Settings"
                title="Settings"
                className={`text-sm transition hover:text-ink focus:outline-none focus-visible:underline focus-visible:decoration-leaf focus-visible:underline-offset-4 ${
                  settingsIsActive ? "font-semibold text-leaf" : "font-medium text-ink/60"
                }`}
              >
                <GearIcon />
              </Link>
            </nav>
            <AuthButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-8">{children}</main>
    </div>
  );
}
