import type { ProgressSummary as ProgressSummaryModel } from "@/lib/models";

export function ProgressSummary({ summary }: { summary: ProgressSummaryModel }) {
  const stats = [
    { label: "Average progress", value: `${summary.averageProgress}%` },
    { label: "Milestones done", value: `${summary.completedMilestones}/${summary.totalMilestones}` },
    { label: "This week", value: `${summary.completedWeeklyActions}/${summary.totalWeeklyActions}` }
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-3">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-lg border border-line bg-white p-4 shadow-sm">
          <p className="text-sm text-ink/60">{stat.label}</p>
          <p className="mt-2 text-2xl font-semibold">{stat.value}</p>
        </div>
      ))}
    </section>
  );
}
