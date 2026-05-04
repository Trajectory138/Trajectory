"use client";

import Link from "next/link";
import type { ReactNode } from "react";

type EmptyStateAction = {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary";
  disabled?: boolean;
};

export function EmptyState({
  headline,
  guidance,
  actions = []
}: {
  headline: string;
  guidance: ReactNode;
  actions?: EmptyStateAction[];
}) {
  return (
    <div className="rounded-lg border border-line bg-paper p-5">
      <h3 className="text-base font-semibold text-ink">{headline}</h3>
      <div className="mt-2 max-w-xl whitespace-pre-line text-sm leading-6 text-ink/60">{guidance}</div>
      {actions.length > 0 ? (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          {actions.map((action) => (
            <EmptyStateActionButton key={action.label} action={action} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function EmptyStateActionButton({ action }: { action: EmptyStateAction }) {
  const className =
    action.variant === "secondary"
      ? "inline-flex items-center justify-center rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-ink/70 transition hover:border-leaf hover:text-leaf disabled:cursor-not-allowed disabled:bg-line disabled:text-ink/50"
      : "inline-flex items-center justify-center rounded-md bg-leaf px-3 py-2 text-sm font-semibold text-white transition hover:bg-ink disabled:cursor-not-allowed disabled:bg-line disabled:text-ink/50";

  if (action.href) {
    return (
      <Link href={action.href} className={className}>
        {action.label}
      </Link>
    );
  }

  return (
    <button type="button" onClick={action.onClick} disabled={action.disabled} className={className}>
      {action.label}
    </button>
  );
}
