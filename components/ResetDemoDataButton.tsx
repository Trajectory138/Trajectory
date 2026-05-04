"use client";

import { useGoalCalendarData } from "@/lib/useGoalCalendarData";

export function ResetDemoDataButton() {
  const { resetDemoData } = useGoalCalendarData();

  return (
    <button
      type="button"
      onClick={resetDemoData}
      className="rounded-md border border-line bg-white px-3 py-2 text-sm font-medium text-ink/70 transition hover:border-leaf hover:text-leaf"
    >
      Reset demo data
    </button>
  );
}
