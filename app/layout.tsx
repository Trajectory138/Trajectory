import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = {
  title: "Trajectory",
  description: "A simple goal execution system for planning milestones and weekly actions."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
