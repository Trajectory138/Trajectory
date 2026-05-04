"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { ResetDemoDataButton } from "@/components/ResetDemoDataButton";

const navItems = [
  { href: "/", label: "Today" },
  { href: "/goals", label: "Goals" },
  { href: "/calendar", label: "Calendar" },
  { href: "/weekly-plan", label: "Weekly Plan" }
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="border-b border-line bg-white/95">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Link href="/" className="text-lg font-semibold tracking-normal">
            Trajectory
          </Link>
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
            </nav>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Link
                href="/goals/new"
                className="inline-flex items-center justify-center rounded-md bg-leaf px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-ink focus:outline-none focus:ring-2 focus:ring-leaf focus:ring-offset-2 focus:ring-offset-2"
              >
                + Create goal
              </Link>
              <ResetDemoDataButton />
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-8">{children}</main>
    </div>
  );
}
