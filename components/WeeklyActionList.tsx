"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { EditableDate, EditableText, EditableTextarea } from "@/components/EditableFields";
import { EmptyState } from "@/components/EmptyState";
import { formatDate } from "@/lib/format";
import type { WeeklyAction } from "@/lib/models";

type WeeklyActionWithGoal = WeeklyAction & {
  goalTitle?: string;
  milestoneTitle?: string;
};

export function WeeklyActionList({
  actions,
  onSetCompleted,
  onUpdateAction,
  onRemove,
  title = "Weekly Actions",
  emptyMessage = "No weekly actions yet.",
  emptyState
}: {
  actions: WeeklyActionWithGoal[];
  onSetCompleted?: (actionId: string, completed: boolean) => void;
  onUpdateAction?: (actionId: string, updates: Partial<WeeklyAction>) => void;
  onRemove?: (actionId: string) => void;
  title?: string;
  emptyMessage?: string;
  emptyState?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-line bg-white p-4 shadow-sm">
      <h2 className="text-base font-semibold">{title}</h2>
      {actions.length === 0 ? (
        <div className="mt-4">
          {emptyState ?? (
            <EmptyState
              headline="No weekly actions yet"
              guidance={emptyMessage}
            />
          )}
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {actions.map((action) => (
            <li
              key={`${action.goalId}-${action.id}`}
              className={`rounded-lg border p-3 ${
                action.completed ? "border-success/30 bg-successSoft" : "border-line bg-paper"
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={action.completed}
                  onChange={() => onSetCompleted?.(action.id, !action.completed)}
                  readOnly={!onSetCompleted}
                  aria-label={`${action.title} completed`}
                  className="mt-1 h-4 w-4 rounded border-line accent-leaf"
                />
                <Link href={`/goals/${action.goalId}/actions/${action.id}`} className="min-w-0 flex-1 rounded-md outline-leaf">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <p className="font-medium text-ink transition hover:text-leaf">{action.title}</p>
                    <p className="text-sm text-ink/60">Week of {formatDate(action.weekStartDate)}</p>
                  </div>
                  {action.goalTitle ? (
                    <p className="mt-1 text-sm text-ink/60">{action.goalTitle}</p>
                  ) : null}
                  {action.milestoneTitle ? (
                    <p className="mt-1 text-xs text-ink/50">Milestone: {action.milestoneTitle}</p>
                  ) : null}
                  {action.completed ? <p className="mt-2 text-xs font-semibold text-success">Done</p> : null}
                  {action.notes ? <p className="mt-2 line-clamp-2 text-sm text-ink/60">{action.notes}</p> : null}
                </Link>
              </div>
              {onUpdateAction ? (
                <div className="mt-4 grid gap-3 rounded-md border border-line bg-white p-3">
                  <EditableText
                    label="Action title"
                    value={action.title}
                    required
                    onSave={(actionTitle) => onUpdateAction(action.id, { title: actionTitle })}
                  />
                  <EditableDate
                    label="Week start"
                    value={action.weekStartDate}
                    required
                    onSave={(weekStartDate) => onUpdateAction(action.id, { weekStartDate })}
                  />
                  <EditableTextarea
                    label="Notes"
                    value={action.notes ?? ""}
                    emptyText="No notes yet."
                    onSave={(notes) => onUpdateAction(action.id, { notes: notes || undefined })}
                  />
                </div>
              ) : null}
              {onSetCompleted ? (
                <button
                  type="button"
                  onClick={() => onSetCompleted(action.id, !action.completed)}
                  className="mt-3 rounded-md bg-leaf px-3 py-2 text-sm font-semibold text-white transition hover:bg-ink"
                >
                  {action.completed ? "Mark incomplete" : "Mark complete"}
                </button>
              ) : action.goalTitle ? (
                <Link href={`/goals/${action.goalId}`} className="mt-3 inline-block text-sm font-semibold text-leaf hover:text-ink">
                  Open goal
                </Link>
              ) : null}
              {onRemove ? (
                <button
                  type="button"
                  onClick={() => {
                    const confirmed = window.confirm("Delete this weekly action?");

                    if (confirmed) {
                      onRemove(action.id);
                    }
                  }}
                  className="ml-2 mt-3 rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-ink/70 transition hover:border-clay hover:text-clay"
                >
                  Remove
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
