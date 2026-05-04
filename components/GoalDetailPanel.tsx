"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Breadcrumbs } from "@/components/Breadcrumbs";
import { DistanceToMissionTarget } from "@/components/DistanceToMissionTarget";
import { EditableDate, EditableText, EditableTextarea } from "@/components/EditableFields";
import { EmptyState } from "@/components/EmptyState";
import { MilestoneList } from "@/components/MilestoneList";
import { MilestoneSuggestionPanel } from "@/components/MilestoneSuggestionPanel";
import { WeeklyActionList } from "@/components/WeeklyActionList";
import { WeeklyActionSuggestionPanel } from "@/components/WeeklyActionSuggestionPanel";
import type { GoalStatus, Milestone, WeeklyAction } from "@/lib/models";
import { useGoalCalendarData } from "@/lib/useGoalCalendarData";

const statusOptions: Array<{ value: GoalStatus; label: string }> = [
  { value: "active", label: "Active" },
  { value: "not_started", label: "Not started" },
  { value: "paused", label: "Paused" },
  { value: "completed", label: "Completed" }
];

function getCurrentWeekStartDate() {
  const today = new Date();
  const day = today.getDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;
  const monday = new Date(today);
  monday.setDate(today.getDate() - daysSinceMonday);

  return monday.toISOString().slice(0, 10);
}

function createId(prefix: string, title: string) {
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);

  return `${prefix}-${slug || "item"}-${Date.now()}`;
}

export function GoalDetailPanel({
  goalId
}: {
  goalId: string;
}) {
  const router = useRouter();
  const {
    getGoalById,
    getMilestonesForGoal,
    getWeeklyActionsForGoal,
    milestones,
    addMilestones,
    addWeeklyActions,
    setMilestoneCompleted,
    setWeeklyActionCompleted,
    updateGoal,
    deleteGoal,
    updateMilestone,
    deleteMilestone,
    updateWeeklyAction,
    removeWeeklyAction
  } = useGoalCalendarData();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    whyItMatters: "",
    targetDate: "",
    status: "active" as GoalStatus
  });
  const [milestoneGenerateSignal, setMilestoneGenerateSignal] = useState(0);
  const [actionGenerateSignal, setActionGenerateSignal] = useState(0);
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [showActionForm, setShowActionForm] = useState(false);
  const [milestoneForm, setMilestoneForm] = useState({
    title: "",
    description: "",
    dueDate: "",
    nextStep: ""
  });
  const [actionForm, setActionForm] = useState({
    title: "",
    milestoneId: "",
    weekStartDate: getCurrentWeekStartDate()
  });
  const goal = getGoalById(goalId);
  const localMilestones = getMilestonesForGoal(goalId);
  const localActions = getWeeklyActionsForGoal(goalId);

  const milestoneTitles = useMemo(
    () => new Map(milestones.map((milestone) => [milestone.id, milestone.title])),
    [milestones]
  );

  if (!goal) {
    return (
      <div className="rounded-lg border border-line bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold">Goal not found</h1>
        <p className="mt-2 text-sm text-ink/70">Reset demo data to restore the sample goals.</p>
      </div>
    );
  }

  const currentGoal = goal;
  const completedActionCount = localActions.filter((action) => action.completed).length;
  const actionsWithLabels = localActions.map((action) => ({
    ...action,
    goalTitle: currentGoal.title,
    milestoneTitle: milestoneTitles.get(action.milestoneId) ?? "Unknown milestone"
  }));

  function startEditing() {
    setEditForm({
      title: currentGoal.title,
      description: currentGoal.description,
      whyItMatters: currentGoal.whyItMatters,
      targetDate: currentGoal.targetDate,
      status: currentGoal.status
    });
    setIsEditing(true);
  }

  function saveGoalEdits() {
    if (!editForm.title.trim() || !editForm.targetDate) {
      return;
    }

    updateGoal(currentGoal.id, {
      title: editForm.title.trim(),
      description: editForm.description.trim(),
      whyItMatters: editForm.whyItMatters.trim(),
      targetDate: editForm.targetDate,
      status: editForm.status
    });
    setIsEditing(false);
  }

  function confirmDeleteGoal() {
    const confirmed = window.confirm(
      "Delete this goal? This will also delete its milestones and weekly actions."
    );

    if (!confirmed) {
      return;
    }

    deleteGoal(currentGoal.id);
    router.push("/goals");
  }

  function addManualMilestone() {
    if (!milestoneForm.title.trim() || !milestoneForm.dueDate) {
      return;
    }

    const milestone: Milestone = {
      id: createId(currentGoal.id, milestoneForm.title),
      goalId: currentGoal.id,
      title: milestoneForm.title.trim(),
      description: milestoneForm.description.trim() || "Manual milestone.",
      dueDate: milestoneForm.dueDate,
      completed: false,
      successCriteria: ["Milestone is complete"],
      blockers: [],
      nextStep: milestoneForm.nextStep.trim() || "Choose the next concrete step."
    };

    addMilestones([milestone]);
    setMilestoneForm({ title: "", description: "", dueDate: "", nextStep: "" });
    setShowMilestoneForm(false);
  }

  function addManualAction() {
    const milestoneId = actionForm.milestoneId || localMilestones[0]?.id;

    if (!actionForm.title.trim() || !milestoneId || !actionForm.weekStartDate) {
      return;
    }

    const action: WeeklyAction = {
      id: createId(currentGoal.id, actionForm.title),
      goalId: currentGoal.id,
      milestoneId,
      title: actionForm.title.trim(),
      description: "Manual weekly action.",
      weekStartDate: actionForm.weekStartDate,
      completed: false,
      estimatedTime: "30 minutes",
      priority: "medium",
      energyLevel: "medium",
      notes: "Added manually from the goal detail page."
    };

    addWeeklyActions([action]);
    setActionForm({ title: "", milestoneId, weekStartDate: getCurrentWeekStartDate() });
    setShowActionForm(false);
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/" },
          { label: "Goals", href: "/goals" },
          { label: goal.title }
        ]}
      />

      <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            {isEditing ? (
              <div className="grid gap-4">
                <label className="block">
                  <span className="text-sm font-medium">Goal title</span>
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
                <label className="block">
                  <span className="text-sm font-medium">Why it matters</span>
                  <textarea
                    value={editForm.whyItMatters}
                    onChange={(event) => setEditForm((current) => ({ ...current, whyItMatters: event.target.value }))}
                    rows={3}
                    className="mt-2 w-full rounded-md border border-line bg-paper px-3 py-2 text-sm outline-leaf"
                  />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-medium">Target date</span>
                    <input
                      type="date"
                      value={editForm.targetDate}
                      onChange={(event) => setEditForm((current) => ({ ...current, targetDate: event.target.value }))}
                      className="mt-2 w-full rounded-md border border-line bg-paper px-3 py-2 text-sm outline-leaf"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium">Status</span>
                    <select
                      value={editForm.status}
                      onChange={(event) =>
                        setEditForm((current) => ({ ...current, status: event.target.value as GoalStatus }))
                      }
                      className="mt-2 w-full rounded-md border border-line bg-paper px-3 py-2 text-sm outline-leaf"
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm font-semibold uppercase text-leaf">{goal.status.replace("_", " ")}</p>
                <div className="mt-2">
                  <EditableText
                    label="Goal title"
                    value={goal.title}
                    required
                    onSave={(title) => updateGoal(goal.id, { title })}
                  />
                </div>
                <div className="mt-4">
                  <EditableTextarea
                    label="Description"
                    value={goal.description}
                    emptyText="No description has been added yet."
                    onSave={(description) => updateGoal(goal.id, { description })}
                  />
                </div>
                <div className="mt-5 rounded-lg border border-line bg-paper p-4">
                  <EditableTextarea
                    label="Why it matters"
                    value={goal.whyItMatters}
                    emptyText="No reason has been added yet."
                    onSave={(whyItMatters) => updateGoal(goal.id, { whyItMatters })}
                  />
                </div>
                <div className="mt-5 rounded-lg border border-line bg-paper p-4">
                  <EditableDate
                    label="Target date"
                    value={goal.targetDate}
                    required
                    onSave={(targetDate) => updateGoal(goal.id, { targetDate })}
                  />
                </div>
              </>
            )}
          </div>

          <div className="lg:min-w-[420px]">
            <DistanceToMissionTarget goal={goal} milestones={localMilestones} />
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2 text-sm">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={saveGoalEdits}
                disabled={!editForm.title.trim() || !editForm.targetDate}
                className="rounded-md bg-leaf px-3 py-2 font-semibold text-white transition hover:bg-ink disabled:cursor-not-allowed disabled:bg-line disabled:text-ink/50"
              >
                Save changes
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="rounded-md border border-line bg-white px-3 py-2 font-semibold text-ink/70 transition hover:border-leaf hover:text-leaf"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={startEditing}
                className="rounded-md border border-line bg-white px-3 py-2 font-semibold text-ink/70 transition hover:border-leaf hover:text-leaf"
              >
                Edit goal
              </button>
              <button
                type="button"
                onClick={confirmDeleteGoal}
                className="rounded-md border border-line bg-white px-3 py-2 font-semibold text-clay transition hover:border-clay hover:bg-white"
              >
                Delete goal
              </button>
            </>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink/60">
          <span>
            {completedActionCount}/{localActions.length} weekly actions complete
          </span>
        </div>
      </section>

      {currentGoal.status === "completed" ? (
        <EmptyState
          headline="🏁 Mission accomplished"
          guidance="You completed this goal.

Take a moment to review what worked,
then set your next target."
          actions={[
            { label: "Create next goal", href: "/goals/new" }
          ]}
        />
      ) : null}

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <MilestoneSuggestionPanel
            goal={goal}
            onAcceptMilestones={addMilestones}
            generateSignal={milestoneGenerateSignal}
          />
          {showMilestoneForm ? (
            <section id="manual-milestone-form" className="rounded-lg border border-line bg-white p-4 shadow-sm">
              <h2 className="text-base font-semibold">Add milestone manually</h2>
              <div className="mt-4 grid gap-4">
                <label className="block">
                  <span className="text-sm font-medium">Title</span>
                  <input
                    value={milestoneForm.title}
                    onChange={(event) => setMilestoneForm((current) => ({ ...current, title: event.target.value }))}
                    className="mt-2 w-full rounded-md border border-line bg-paper px-3 py-2 text-sm outline-leaf"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium">Description</span>
                  <textarea
                    value={milestoneForm.description}
                    onChange={(event) => setMilestoneForm((current) => ({ ...current, description: event.target.value }))}
                    rows={3}
                    className="mt-2 w-full rounded-md border border-line bg-paper px-3 py-2 text-sm outline-leaf"
                  />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-medium">Due date</span>
                    <input
                      type="date"
                      value={milestoneForm.dueDate}
                      onChange={(event) => setMilestoneForm((current) => ({ ...current, dueDate: event.target.value }))}
                      className="mt-2 w-full rounded-md border border-line bg-paper px-3 py-2 text-sm outline-leaf"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium">Next step</span>
                    <input
                      value={milestoneForm.nextStep}
                      onChange={(event) => setMilestoneForm((current) => ({ ...current, nextStep: event.target.value }))}
                      className="mt-2 w-full rounded-md border border-line bg-paper px-3 py-2 text-sm outline-leaf"
                    />
                  </label>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <button
                    type="button"
                    onClick={addManualMilestone}
                    disabled={!milestoneForm.title.trim() || !milestoneForm.dueDate}
                    className="rounded-md bg-leaf px-3 py-2 text-sm font-semibold text-white transition hover:bg-ink disabled:cursor-not-allowed disabled:bg-line disabled:text-ink/50"
                  >
                    Add milestone
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowMilestoneForm(false)}
                    className="rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-ink/70 transition hover:border-leaf hover:text-leaf"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </section>
          ) : null}
          <MilestoneList
            milestones={localMilestones}
            onSetCompleted={setMilestoneCompleted}
            onUpdateMilestone={updateMilestone}
            onDeleteMilestone={deleteMilestone}
            emptyState={
              <EmptyState
                headline="🧩 Break this goal into steps"
                guidance="This goal needs milestones.
They define what progress looks like."
                actions={[
                  { label: "Suggest milestones", onClick: () => setMilestoneGenerateSignal((current) => current + 1) },
                  { label: "Add manually", onClick: () => setShowMilestoneForm(true), variant: "secondary" }
                ]}
              />
            }
          />
        </div>

        <div className="space-y-4">
          <WeeklyActionSuggestionPanel
            goal={goal}
            milestones={localMilestones}
            onAcceptActions={addWeeklyActions}
            generateSignal={actionGenerateSignal}
          />
          {showActionForm ? (
            <section id="manual-action-form" className="rounded-lg border border-line bg-white p-4 shadow-sm">
              <h2 className="text-base font-semibold">Add weekly action manually</h2>
              <div className="mt-4 grid gap-4">
                <label className="block">
                  <span className="text-sm font-medium">Action</span>
                  <input
                    value={actionForm.title}
                    onChange={(event) => setActionForm((current) => ({ ...current, title: event.target.value }))}
                    className="mt-2 w-full rounded-md border border-line bg-paper px-3 py-2 text-sm outline-leaf"
                  />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-medium">Milestone</span>
                    <select
                      value={actionForm.milestoneId || localMilestones[0]?.id || ""}
                      onChange={(event) => setActionForm((current) => ({ ...current, milestoneId: event.target.value }))}
                      className="mt-2 w-full rounded-md border border-line bg-paper px-3 py-2 text-sm outline-leaf"
                    >
                      {localMilestones.map((milestone) => (
                        <option key={milestone.id} value={milestone.id}>
                          {milestone.title}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium">Week start</span>
                    <input
                      type="date"
                      value={actionForm.weekStartDate}
                      onChange={(event) => setActionForm((current) => ({ ...current, weekStartDate: event.target.value }))}
                      className="mt-2 w-full rounded-md border border-line bg-paper px-3 py-2 text-sm outline-leaf"
                    />
                  </label>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <button
                    type="button"
                    onClick={addManualAction}
                    disabled={!actionForm.title.trim() || localMilestones.length === 0 || !actionForm.weekStartDate}
                    className="rounded-md bg-leaf px-3 py-2 text-sm font-semibold text-white transition hover:bg-ink disabled:cursor-not-allowed disabled:bg-line disabled:text-ink/50"
                  >
                    Add action
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowActionForm(false)}
                    className="rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-ink/70 transition hover:border-leaf hover:text-leaf"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </section>
          ) : null}
          <WeeklyActionList
            actions={actionsWithLabels}
            onSetCompleted={setWeeklyActionCompleted}
            onUpdateAction={updateWeeklyAction}
            onRemove={removeWeeklyAction}
            emptyState={
              localMilestones.length > 0 ? (
                <EmptyState
                  headline="📅 Plan your week"
                  guidance="Milestones exist, but nothing is scheduled this week.

Choose or generate actions to move forward."
                  actions={[
                    { label: "Suggest weekly actions", onClick: () => setActionGenerateSignal((current) => current + 1) },
                    { label: "Add manually", onClick: () => setShowActionForm(true), variant: "secondary" }
                  ]}
                />
              ) : (
                <EmptyState
                  headline="Weekly actions come after milestones"
                  guidance="Add at least one milestone first, then create or generate weekly actions from it."
                  actions={[
                    { label: "Use milestone suggestions", href: "#milestone-suggestions" }
                  ]}
                />
              )
            }
          />
        </div>
      </section>
    </div>
  );
}
