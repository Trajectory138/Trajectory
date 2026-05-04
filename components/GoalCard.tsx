import Link from "next/link";

import { EditableDate, EditableText, EditableTextarea } from "@/components/EditableFields";
import { getGoalProgress } from "@/lib/goals";
import { formatDate } from "@/lib/format";
import type { Goal } from "@/lib/models";

const statusLabels: Record<Goal["status"], string> = {
  not_started: "Not started",
  active: "Active",
  paused: "Paused",
  completed: "Completed"
};

export function GoalCard({
  goal,
  progress = getGoalProgress(goal.id),
  onUpdateGoal,
  onDeleteGoal
}: {
  goal: Goal;
  progress?: number;
  onUpdateGoal?: (goalId: string, updates: Partial<Goal>) => void;
  onDeleteGoal?: (goalId: string) => void;
}) {

  return (
    <article className="rounded-lg border border-line bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase text-leaf">{statusLabels[goal.status]}</p>
          <h2 className="mt-1 text-lg font-semibold">{goal.title}</h2>
        </div>
        <span className="shrink-0 rounded-md bg-sky px-2 py-1 text-sm font-semibold">
          {progress}%
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-ink/70">{goal.description}</p>
      {onUpdateGoal ? (
        <div className="mt-4 grid gap-3 rounded-md border border-line bg-paper p-3">
          <EditableText
            label="Goal title"
            value={goal.title}
            required
            onSave={(title) => onUpdateGoal(goal.id, { title })}
          />
          <EditableTextarea
            label="Description"
            value={goal.description}
            emptyText="No description yet."
            onSave={(description) => onUpdateGoal(goal.id, { description })}
          />
          <EditableDate
            label="Target date"
            value={goal.targetDate}
            required
            onSave={(targetDate) => onUpdateGoal(goal.id, { targetDate })}
          />
        </div>
      ) : null}
      <div className="mt-4 h-2 rounded-full bg-line">
        <div className="h-2 rounded-full bg-leaf" style={{ width: `${progress}%` }} />
      </div>
      <div className="mt-4 flex flex-col gap-3 text-sm text-ink/70 sm:flex-row sm:items-center sm:justify-between">
        <span>Target {formatDate(goal.targetDate)}</span>
        <div className="flex flex-wrap gap-3">
          <Link href={`/goals/${goal.id}`} className="font-semibold text-leaf hover:text-ink">
            View details
          </Link>
          {onDeleteGoal ? (
            <button
              type="button"
              onClick={() => {
                const confirmed = window.confirm(
                  "Delete this goal? This will also delete its milestones and weekly actions."
                );

                if (confirmed) {
                  onDeleteGoal(goal.id);
                }
              }}
              className="font-semibold text-clay hover:text-ink"
            >
              Delete
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
