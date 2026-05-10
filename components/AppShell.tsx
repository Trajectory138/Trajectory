"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { AuthButton } from "@/components/AuthButton";

const navItems = [
  { href: "/", label: "Today" },
  { href: "/goals", label: "Goals" },
  { href: "/calendar", label: "Calendar" },
  { href: "/weekly-plan", label: "Weekly Plan" },
  { href: "/settings", label: "Settings" },
];

function HamburgerIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="border-b border-line bg-white/95">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          
          {/* Left: logo + create */}
          <div className="flex items-center gap-3">
            <Link href="/" className="text-lg font-semibold tracking-normal">
              DoWhatNow
            </Link>
            <Link
              href="/goals/new"
              className="inline-flex items-center justify-center rounded-md bg-leaf px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-ink focus:outline-none focus:ring-2 focus:ring-leaf focus:ring-offset-2"
            >
              + Create goal
            </Link>
          </div>

          {/* Right: desktop nav + auth */}
          <div className="hidden sm:flex sm:items-center sm:gap-4">
            <nav className="flex gap-2" aria-label="Main navigation">
              {navItems.map((item) => {
                const isActive =
                  item.href === "/" ? pathname === item.href : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`text-sm transition hover:text-ink focus:outline-none focus-visible:underline focus-visible:decoration-leaf focus-visible:underline-offset-4 ${
                      isActive ? "font-semibold text-leaf" : "font-medium text-ink/60"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <AuthButton />
          </div>

          {/* Right: hamburger (mobile only) */}
          <button
            className="flex sm:hidden items-center justify-center rounded-md p-2 text-ink/60 hover:text-ink focus:outline-none focus:ring-2 focus:ring-leaf"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <CloseIcon /> : <HamburgerIcon />}
          </button>
        </div>

        {/* Mobile dropdown menu */}
        {menuOpen && (
          <div className="border-t border-line bg-white px-4 py-3 sm:hidden">
            <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
              {navItems.map((item) => {
                const isActive =
                  item.href === "/" ? pathname === item.href : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={`rounded-md px-3 py-2 text-sm transition hover:bg-paper ${
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
            <div className="mt-3 border-t border-line pt-3">
              <AuthButton />
            </div>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-8">{children}</main>
    </div>
  );
}
