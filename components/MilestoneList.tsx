"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { EditableDate, EditableText, EditableTextarea } from "@/components/EditableFields";
import { EmptyState } from "@/components/EmptyState";
import { formatDate } from "@/lib/format";
import type { Milestone } from "@/lib/models";

export function MilestoneList({
  milestones,
  onSetCompleted,
  onUpdateMilestone,
  onDeleteMilestone,
  emptyState
}: {
  milestones: Milestone[];
  onSetCompleted?: (milestoneId: string, completed: boolean) => void;
  onUpdateMilestone?: (milestoneId: string, updates: Partial<Milestone>) => void;
  onDeleteMilestone?: (milestoneId: string) => void;
  emptyState?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-line bg-white p-4 shadow-sm">
      <h2 className="text-base font-semibold">Milestones</h2>
      {milestones.length === 0 ? (
        <div className="mt-4">
          {emptyState ?? (
            <EmptyState
              headline="No milestones yet"
              guidance="Add milestones to break this goal into visible checkpoints."
            />
          )}
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {milestones.map((milestone) => (
            <li
              key={milestone.id}
              className={`rounded-lg border p-3 ${
                milestone.completed ? "border-success/30 bg-successSoft" : "border-line bg-paper"
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`mt-1 h-3 w-3 rounded-full border ${
                    milestone.completed ? "border-success bg-success" : "border-clay bg-white"
                  }`}
                  aria-hidden="true"
                />
                <Link
                  href={`/goals/${milestone.goalId}/milestones/${milestone.id}`}
                  className="min-w-0 flex-1 rounded-md outline-leaf"
                >
                  <p className="font-medium text-ink transition hover:text-leaf">{milestone.title}</p>
                  <p className="mt-1 text-sm text-ink/60">
                    Due {formatDate(milestone.dueDate)}
                    {milestone.completed ? <span className="ml-2 font-semibold text-success">Done</span> : null}
                  </p>
                  {milestone.notes ? <p className="mt-2 line-clamp-2 text-sm text-ink/60">{milestone.notes}</p> : null}
                </Link>
              </div>
              {onUpdateMilestone ? (
                <div className="mt-4 grid gap-3 rounded-md border border-line bg-white p-3">
                  <EditableText
                    label="Milestone title"
                    value={milestone.title}
                    required
                    onSave={(title) => onUpdateMilestone(milestone.id, { title })}
                  />
                  <EditableDate
                    label="Due date"
                    value={milestone.dueDate}
                    required
                    onSave={(dueDate) => onUpdateMilestone(milestone.id, { dueDate })}
                  />
                  <EditableTextarea
                    label="Description"
                    value={milestone.description}
                    onSave={(description) => onUpdateMilestone(milestone.id, { description })}
                  />
                  <EditableTextarea
                    label="Notes"
                    value={milestone.notes ?? ""}
                    emptyText="No notes yet."
                    onSave={(notes) => onUpdateMilestone(milestone.id, { notes: notes || undefined })}
                  />
                </div>
              ) : null}
              {onSetCompleted ? (
                <button
                  type="button"
                  onClick={() => onSetCompleted(milestone.id, !milestone.completed)}
                  className="mt-3 rounded-md bg-leaf px-3 py-2 text-sm font-semibold text-white transition hover:bg-ink"
                >
                  {milestone.completed ? "Mark incomplete" : "Mark complete"}
                </button>
              ) : null}
              {onDeleteMilestone ? (
                <button
                  type="button"
                  onClick={() => {
                    const confirmed = window.confirm(
                      "Delete this milestone? Related weekly actions connected to it will also be deleted."
                    );

                    if (confirmed) {
                      onDeleteMilestone(milestone.id);
                    }
                  }}
                  className="ml-2 mt-3 rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-clay transition hover:border-clay hover:bg-white"
                >
                  Delete
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
