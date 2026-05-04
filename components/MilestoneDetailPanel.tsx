"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { Breadcrumbs } from "@/components/Breadcrumbs";
import { EmptyState } from "@/components/EmptyState";
import { WeeklyActionList } from "@/components/WeeklyActionList";
import { formatDate } from "@/lib/format";
import { useGoalCalendarData } from "@/lib/useGoalCalendarData";

export function MilestoneDetailPanel({
  goalId,
  milestoneId
}: {
  goalId: string;
  milestoneId: string;
}) {
  const router = useRouter();
  const {
    getGoalById,
    milestones,
    weeklyActions,
    setMilestoneCompleted,
    setWeeklyActionCompleted,
    updateMilestone,
    deleteMilestone,
    updateWeeklyAction,
    removeWeeklyAction
  } = useGoalCalendarData();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    dueDate: "",
    notes: "",
    successCriteria: "",
    blockers: "",
    nextStep: ""
  });
  const goal = getGoalById(goalId);
  const milestone = milestones.find((item) => item.id === milestoneId && item.goalId === goalId);
  const relatedActions = weeklyActions.filter(
    (action) => action.goalId === goalId && action.milestoneId === milestoneId
  );

  if (!goal || !milestone) {
    return (
      <div className="rounded-lg border border-line bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold">Milestone not found</h1>
        <p className="mt-2 text-sm text-ink/70">Reset demo data to restore the sample milestones.</p>
        <Link href={`/goals/${goalId}`} className="mt-4 inline-block text-sm font-semibold text-leaf hover:text-ink">
          Back to goal
        </Link>
      </div>
    );
  }

  const currentGoal = goal;
  const currentMilestone = milestone;
  const relatedActionsWithLabels = relatedActions.map((action) => ({
    ...action,
    goalTitle: currentGoal.title,
    milestoneTitle: currentMilestone.title
  }));

  function startEditing() {
    setEditForm({
      title: currentMilestone.title,
      description: currentMilestone.description,
      dueDate: currentMilestone.dueDate,
      notes: currentMilestone.notes ?? "",
      successCriteria: currentMilestone.successCriteria.join("\n"),
      blockers: currentMilestone.blockers.join("\n"),
      nextStep: currentMilestone.nextStep
    });
    setIsEditing(true);
  }

  function saveMilestoneEdits() {
    if (!editForm.title.trim() || !editForm.dueDate) {
      return;
    }

    updateMilestone(currentMilestone.id, {
      title: editForm.title.trim(),
      description: editForm.description.trim(),
      dueDate: editForm.dueDate,
      notes: editForm.notes.trim() || undefined,
      successCriteria: editForm.successCriteria.split("\n").map((item) => item.trim()).filter(Boolean),
      blockers: editForm.blockers.split("\n").map((item) => item.trim()).filter(Boolean),
      nextStep: editForm.nextStep.trim()
    });
    setIsEditing(false);
  }

  function confirmDeleteMilestone() {
    const confirmed = window.confirm(
      "Delete this milestone? Related weekly actions connected to it will also be deleted."
    );

    if (!confirmed) {
      return;
    }

    deleteMilestone(currentMilestone.id);
    router.push(`/goals/${currentGoal.id}`);
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/" },
          { label: "Goals", href: "/goals" },
          { label: goal.title, href: `/goals/${goal.id}` },
          { label: milestone.title }
        ]}
      />

      <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            {isEditing ? (
              <div className="grid gap-4">
                <label className="block">
                  <span className="text-sm font-medium">Milestone title</span>
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
                    <span className="text-sm font-medium">Due date</span>
                    <input
                      type="date"
                      value={editForm.dueDate}
                      onChange={(event) => setEditForm((current) => ({ ...current, dueDate: event.target.value }))}
                      className="mt-2 w-full rounded-md border border-line bg-paper px-3 py-2 text-sm outline-leaf"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium">Next step</span>
                    <input
                      value={editForm.nextStep}
                      onChange={(event) => setEditForm((current) => ({ ...current, nextStep: event.target.value }))}
                      className="mt-2 w-full rounded-md border border-line bg-paper px-3 py-2 text-sm outline-leaf"
                    />
                  </label>
                </div>
                <label className="block">
                  <span className="text-sm font-medium">Success criteria, one per line</span>
                  <textarea
                    value={editForm.successCriteria}
                    onChange={(event) => setEditForm((current) => ({ ...current, successCriteria: event.target.value }))}
                    rows={3}
                    className="mt-2 w-full rounded-md border border-line bg-paper px-3 py-2 text-sm outline-leaf"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium">Blockers, one per line</span>
                  <textarea
                    value={editForm.blockers}
                    onChange={(event) => setEditForm((current) => ({ ...current, blockers: event.target.value }))}
                    rows={3}
                    className="mt-2 w-full rounded-md border border-line bg-paper px-3 py-2 text-sm outline-leaf"
                  />
                </label>
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
                <p className="text-sm font-semibold uppercase text-leaf">Milestone</p>
                <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">{milestone.title}</h1>
                <Link href={`/goals/${goal.id}`} className="mt-3 inline-block text-sm font-semibold text-leaf hover:text-ink">
                  {goal.title}
                </Link>
                <p className="mt-4 text-sm leading-6 text-ink/70">{milestone.description}</p>
                <div className="mt-5 rounded-lg border border-line bg-paper p-4">
                  <p className="text-sm font-semibold">Notes</p>
                  <p className="mt-2 text-sm leading-6 text-ink/70">
                    {milestone.notes ?? "No notes have been added for this milestone yet."}
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[420px]">
            <div className="rounded-lg border border-line bg-paper p-4">
              <p className="text-sm text-ink/60">Due date</p>
              <p className="mt-1 font-semibold">{formatDate(milestone.dueDate)}</p>
            </div>
            <div className="rounded-lg bg-sky p-4">
              <p className="text-sm text-ink/60">Status</p>
              <p className="mt-1 text-xl font-semibold">{milestone.completed ? "Complete" : "Open"}</p>
            </div>
            <div className="rounded-lg border border-line bg-paper p-4">
              <p className="text-sm text-ink/60">Actions</p>
              <p className="mt-1 text-xl font-semibold">{relatedActions.length}</p>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={saveMilestoneEdits}
                disabled={!editForm.title.trim() || !editForm.dueDate}
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
                onClick={() => setMilestoneCompleted(milestone.id, !milestone.completed)}
                className="rounded-md bg-leaf px-3 py-2 text-sm font-semibold text-white transition hover:bg-ink"
              >
                {milestone.completed ? "Mark incomplete" : "Mark complete"}
              </button>
              <button
                type="button"
                onClick={startEditing}
                className="rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-ink/70 transition hover:border-leaf hover:text-leaf"
              >
                Edit milestone
              </button>
              <button
                type="button"
                onClick={confirmDeleteMilestone}
                className="rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-clay transition hover:border-clay hover:bg-white"
              >
                Delete milestone
              </button>
            </>
          )}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-line bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold">Success Criteria</h2>
          <ul className="mt-3 space-y-2">
            {milestone.successCriteria.map((item) => (
              <li key={item} className="rounded-md border border-line bg-paper p-3 text-sm text-ink/70">
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-line bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold">Blockers</h2>
          {milestone.blockers.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {milestone.blockers.map((item) => (
                <li key={item} className="rounded-md border border-line bg-paper p-3 text-sm text-ink/70">
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-ink/60">No blockers listed.</p>
          )}
        </div>

        <div className="rounded-lg border border-line bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold">Next Step</h2>
          <p className="mt-3 rounded-md border border-line bg-paper p-3 text-sm leading-6 text-ink/70">
            {milestone.nextStep}
          </p>
        </div>
      </section>

      <WeeklyActionList
        actions={relatedActionsWithLabels}
        onSetCompleted={setWeeklyActionCompleted}
        onUpdateAction={updateWeeklyAction}
        onRemove={removeWeeklyAction}
        title="Related Weekly Actions"
        emptyMessage="No weekly actions are connected to this milestone yet."
        emptyState={
          <EmptyState
            headline="No actions connected to this milestone"
            guidance="Create weekly actions from the goal page or weekly plan so this milestone has a clear next move."
            actions={[
              { label: "Open weekly plan", href: "/weekly-plan" },
              { label: "Back to goal", href: `/goals/${goal.id}`, variant: "secondary" }
            ]}
          />
        }
      />
    </div>
  );
}
