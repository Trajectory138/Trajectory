"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { Breadcrumbs } from "@/components/Breadcrumbs";
import { formatDate } from "@/lib/format";
import type { WeeklyActionEnergyLevel, WeeklyActionPriority } from "@/lib/models";
import { useGoalCalendarData } from "@/lib/useGoalCalendarData";

const priorityOptions: WeeklyActionPriority[] = ["high", "medium", "low"];
const energyOptions: WeeklyActionEnergyLevel[] = ["high", "medium", "low"];

export function WeeklyActionDetailPanel({
  goalId,
  actionId
}: {
  goalId: string;
  actionId: string;
}) {
  const router = useRouter();
  const {
    getGoalById,
    milestones,
    weeklyActions,
    setWeeklyActionCompleted,
    updateWeeklyAction,
    removeWeeklyAction
  } = useGoalCalendarData();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    milestoneId: "",
    weekStartDate: "",
    estimatedTime: "",
    priority: "medium" as WeeklyActionPriority,
    energyLevel: "medium" as WeeklyActionEnergyLevel,
    notes: ""
  });
  const goal = getGoalById(goalId);
  const action = weeklyActions.find((item) => item.id === actionId && item.goalId === goalId);
  const milestone = action
    ? milestones.find((item) => item.id === action.milestoneId && item.goalId === goalId)
    : undefined;

  if (!goal || !action) {
    return (
      <div className="rounded-lg border border-line bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold">Weekly action not found</h1>
        <p className="mt-2 text-sm text-ink/70">Reset demo data to restore the sample weekly actions.</p>
        <Link href={`/goals/${goalId}`} className="mt-4 inline-block text-sm font-semibold text-leaf hover:text-ink">
          Back to goal
        </Link>
      </div>
    );
  }

  const currentGoal = goal;
  const currentAction = action;
  const goalMilestones = milestones.filter((item) => item.goalId === currentGoal.id);

  function startEditing() {
    setEditForm({
      title: currentAction.title,
      description: currentAction.description,
      milestoneId: currentAction.milestoneId,
      weekStartDate: currentAction.weekStartDate,
      estimatedTime: currentAction.estimatedTime,
      priority: currentAction.priority,
      energyLevel: currentAction.energyLevel,
      notes: currentAction.notes ?? ""
    });
    setIsEditing(true);
  }

  function saveActionEdits() {
    if (!editForm.title.trim() || !editForm.weekStartDate || !editForm.milestoneId) {
      return;
    }

    updateWeeklyAction(currentAction.id, {
      title: editForm.title.trim(),
      description: editForm.description.trim(),
      milestoneId: editForm.milestoneId,
      weekStartDate: editForm.weekStartDate,
      estimatedTime: editForm.estimatedTime.trim() || "30 minutes",
      priority: editForm.priority,
      energyLevel: editForm.energyLevel,
      notes: editForm.notes.trim() || undefined
    });
    setIsEditing(false);
  }

  function confirmDeleteAction() {
    const confirmed = window.confirm("Delete this weekly action?");

    if (!confirmed) {
      return;
    }

    removeWeeklyAction(currentAction.id);
    router.push(`/goals/${currentGoal.id}`);
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/" },
          { label: "Goals", href: "/goals" },
          { label: goal.title, href: `/goals/${goal.id}` },
          { label: action.title }
        ]}
      />

      <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            {isEditing ? (
              <div className="grid gap-4">
                <label className="block">
                  <span className="text-sm font-medium">Action title</span>
                  <input
                    value={editForm.title}
                    onChange={(event) => setEditForm((current) => ({ ...current, title: event.target.value }))}
                    className="mt-2 w-full rounded-md border border-line bg-paper px-3 py-2 text-sm outline-leaf"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium">Description</span>
                  <textarea
                    value={editForm.description}
                    onChange={(event) => setEditForm((current) => ({ ...current, description: event.target.value }))}
                    rows={3}
                    className="mt-2 w-full rounded-md border border-line bg-paper px-3 py-2 text-sm outline-leaf"
                  />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-medium">Milestone</span>
                    <select
                      value={editForm.milestoneId}
                      onChange={(event) => setEditForm((current) => ({ ...current, milestoneId: event.target.value }))}
                      className="mt-2 w-full rounded-md border border-line bg-paper px-3 py-2 text-sm outline-leaf"
                    >
                      {goalMilestones.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.title}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium">Week start</span>
                    <input
                      type="date"
                      value={editForm.weekStartDate}
                      onChange={(event) => setEditForm((current) => ({ ...current, weekStartDate: event.target.value }))}
                      className="mt-2 w-full rounded-md border border-line bg-paper px-3 py-2 text-sm outline-leaf"
                    />
                  </label>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <label className="block">
                    <span className="text-sm font-medium">Estimated time</span>
                    <input
                      value={editForm.estimatedTime}
                      onChange={(event) => setEditForm((current) => ({ ...current, estimatedTime: event.target.value }))}
                      className="mt-2 w-full rounded-md border border-line bg-paper px-3 py-2 text-sm outline-leaf"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium">Priority</span>
                    <select
                      value={editForm.priority}
                      onChange={(event) =>
                        setEditForm((current) => ({ ...current, priority: event.target.value as WeeklyActionPriority }))
                      }
                      className="mt-2 w-full rounded-md border border-line bg-paper px-3 py-2 text-sm outline-leaf"
                    >
                      {priorityOptions.map((priority) => (
                        <option key={priority} value={priority}>
                          {priority}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium">Energy</span>
                    <select
                      value={editForm.energyLevel}
                      onChange={(event) =>
                        setEditForm((current) => ({ ...current, energyLevel: event.target.value as WeeklyActionEnergyLevel }))
                      }
                      className="mt-2 w-full rounded-md border border-line bg-paper px-3 py-2 text-sm outline-leaf"
                    >
                      {energyOptions.map((energy) => (
                        <option key={energy} value={energy}>
                          {energy}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="block">
                  <span className="text-sm font-medium">Notes</span>
                  <textarea
                    value={editForm.notes}
                    onChange={(event) => setEditForm((current) => ({ ...current, notes: event.target.value }))}
                    rows={3}
                    className="mt-2 w-full rounded-md border border-line bg-paper px-3 py-2 text-sm outline-leaf"
                  />
                </label>
              </div>
            ) : (
              <>
                <p className="text-sm font-semibold uppercase text-leaf">Weekly Action</p>
                <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">{action.title}</h1>
                <p className="mt-3 text-sm leading-6 text-ink/70">{action.description}</p>
                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm">
                  <Link href={`/goals/${goal.id}`} className="font-semibold text-leaf hover:text-ink">
                    {goal.title}
                  </Link>
                  {milestone ? (
                    <Link
                      href={`/goals/${goal.id}/milestones/${milestone.id}`}
                      className="font-semibold text-leaf hover:text-ink"
                    >
                      {milestone.title}
                    </Link>
                  ) : (
                    <span className="text-ink/60">Unknown milestone</span>
                  )}
                </div>

                <div className="mt-5 rounded-lg border border-line bg-paper p-4">
                  <p className="text-sm font-semibold">Notes</p>
                  <p className="mt-2 text-sm leading-6 text-ink/70">
                    {action.notes ?? "No notes have been added for this weekly action yet."}
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[420px]">
            <div className="rounded-lg border border-line bg-paper p-4">
              <p className="text-sm text-ink/60">Week start</p>
              <p className="mt-1 font-semibold">{formatDate(action.weekStartDate)}</p>
            </div>
            <div className="rounded-lg bg-sky p-4">
              <p className="text-sm text-ink/60">Status</p>
              <p className="mt-1 text-xl font-semibold">{action.completed ? "Complete" : "Open"}</p>
            </div>
            <div className="rounded-lg border border-line bg-paper p-4">
              <p className="text-sm text-ink/60">Milestone</p>
              {milestone ? (
                <Link
                  href={`/goals/${goal.id}/milestones/${milestone.id}`}
                  className="mt-1 block text-sm font-semibold text-ink transition hover:text-leaf"
                >
                  {milestone.title}
                </Link>
              ) : (
                <p className="mt-1 text-sm font-semibold">Unknown</p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={saveActionEdits}
                disabled={!editForm.title.trim() || !editForm.weekStartDate || !editForm.milestoneId}
                className="rounded-md bg-leaf px-3 py-2 text-sm font-semibold text-white transition hover:bg-ink disabled:cursor-not-allowed disabled:bg-line disabled:text-ink/50"
              >
                Save changes
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-ink/70 transition hover:border-leaf hover:text-leaf"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setWeeklyActionCompleted(action.id, !action.completed)}
                className="rounded-md bg-leaf px-3 py-2 text-sm font-semibold text-white transition hover:bg-ink"
              >
                {action.completed ? "Mark incomplete" : "Mark complete"}
              </button>
              <button
                type="button"
                onClick={startEditing}
                className="rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-ink/70 transition hover:border-leaf hover:text-leaf"
              >
                Edit action
              </button>
              <button
                type="button"
                onClick={confirmDeleteAction}
                className="rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-clay transition hover:border-clay hover:bg-white"
              >
                Delete action
              </button>
            </>
          )}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-line bg-white p-4 shadow-sm">
          <p className="text-sm text-ink/60">Estimated time</p>
          <p className="mt-1 text-xl font-semibold">{action.estimatedTime}</p>
        </div>
        <div className="rounded-lg border border-line bg-white p-4 shadow-sm">
          <p className="text-sm text-ink/60">Priority</p>
          <p className="mt-1 text-xl font-semibold capitalize">{action.priority}</p>
        </div>
        <div className="rounded-lg border border-line bg-white p-4 shadow-sm">
          <p className="text-sm text-ink/60">Energy level</p>
          <p className="mt-1 text-xl font-semibold capitalize">{action.energyLevel}</p>
        </div>
      </section>
    </div>
  );
}
