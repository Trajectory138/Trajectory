"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { EditableDate, EditableText, EditableTextarea } from "@/components/EditableFields";
import { EmptyState } from "@/components/EmptyState";
import {
  getCurrentStreak,
  getCurrentWeekStartDate,
  getTodayDateKey,
  getWeekExecutionStats
} from "@/lib/executionTracking";
import { formatDate } from "@/lib/format";
import type { Goal, Milestone, WeeklyAction, WeeklyActionEnergyLevel, WeeklyActionPriority } from "@/lib/models";
import { useGoalCalendarData } from "@/lib/useGoalCalendarData";
import { suggestWeeklyActionsForGoal } from "@/lib/weeklyActionSuggestions";

type DraftAction = {
  draftId: string;
  goalId: string;
  milestoneId: string;
  title: string;
  description: string;
  estimatedTime: string;
  priority: WeeklyActionPriority;
  energyLevel: WeeklyActionEnergyLevel;
  notes?: string;
};

type FormState = {
  title: string;
  milestoneId: string;
};

function getFeedback(completionPercentage: number) {
  if (completionPercentage >= 80) {
    return "Ahead";
  }

  if (completionPercentage >= 40) {
    return "On track";
  }

  return "Behind";
}

function getActionId(goalId: string, title: string, index: number) {
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);

  return `${goalId}-${slug || "weekly-action"}-${Date.now()}-${index}`;
}

function getMilestoneTitle(milestonesById: Map<string, Milestone>, milestoneId: string) {
  return milestonesById.get(milestoneId)?.title ?? "Unknown milestone";
}

export function WeeklyPlanner() {
  const {
    goals,
    milestones,
    weeklyActions,
    executionLogs,
    addWeeklyActions,
    setWeeklyActionCompleted,
    updateWeeklyAction,
    removeWeeklyAction
  } = useGoalCalendarData();
  const activeGoals = goals.filter((goal) => goal.status === "active");
  const incompleteMilestones = milestones.filter((milestone) => !milestone.completed);
  const weekStartDate = getCurrentWeekStartDate();
  const activeWeekActions = weeklyActions.filter(
    (action) => action.activeWeek && action.weekStartDate === weekStartDate
  );
  const milestonesById = useMemo(
    () => new Map(milestones.map((milestone) => [milestone.id, milestone])),
    [milestones]
  );
  const goalsById = useMemo(
    () => new Map(goals.map((goal) => [goal.id, goal])),
    [goals]
  );

  const [draftActions, setDraftActions] = useState<DraftAction[]>([]);
  const [forms, setForms] = useState<Record<string, FormState>>({});
  const [weekCompleted, setWeekCompleted] = useState(false);
  const [extraActionMode, setExtraActionMode] = useState(false);

  const completedActiveActions = activeWeekActions.filter((action) => action.completed).length;
  const executionStats = getWeekExecutionStats({ logs: executionLogs, weekStartDate });
  const currentStreak = getCurrentStreak(executionLogs, getTodayDateKey());
  const completionPercentage = activeWeekActions.length
    ? Math.round((completedActiveActions / activeWeekActions.length) * 100)
    : 0;
  const allActiveWeekActionsCompleted = activeWeekActions.length > 0 && completedActiveActions === activeWeekActions.length;
  const feedback = getFeedback(completionPercentage);
  const canStartWeek = draftActions.length > 0 && activeWeekActions.length === 0;

  function getGoalMilestones(goalId: string) {
    return incompleteMilestones.filter((milestone) => milestone.goalId === goalId);
  }

  function getGoalDrafts(goalId: string) {
    return draftActions.filter((action) => action.goalId === goalId);
  }

  function getGoalForm(goal: Goal) {
    const goalMilestones = getGoalMilestones(goal.id);

    return {
      title: forms[goal.id]?.title ?? "",
      milestoneId: forms[goal.id]?.milestoneId ?? goalMilestones[0]?.id ?? ""
    };
  }

  function updateGoalForm(goalId: string, changes: Partial<FormState>) {
    setForms((current) => ({
      ...current,
      [goalId]: {
        title: current[goalId]?.title ?? "",
        milestoneId: current[goalId]?.milestoneId ?? getGoalMilestones(goalId)[0]?.id ?? "",
        ...changes
      }
    }));
  }

  function addDraftAction(goal: Goal) {
    const goalDrafts = getGoalDrafts(goal.id);
    const goalActiveActions = activeWeekActions.filter((action) => action.goalId === goal.id);
    const form = getGoalForm(goal);

    if (goalDrafts.length + goalActiveActions.length >= 3 || !form.title.trim() || !form.milestoneId) {
      return;
    }

    if (activeWeekActions.length > 0 && !extraActionMode) {
      return;
    }

    if (extraActionMode) {
      addWeeklyActions([
        {
          id: getActionId(goal.id, form.title, goalActiveActions.length),
          goalId: goal.id,
          milestoneId: form.milestoneId,
          title: form.title.trim(),
          description: "Extra action added after completing the planned week.",
          weekStartDate,
          completed: false,
          estimatedTime: "30 minutes",
          priority: "medium",
          energyLevel: "medium",
          notes: "Added as an extra action from the weekly planning flow.",
          activeWeek: true,
          weekLocked: true
        }
      ]);
      updateGoalForm(goal.id, { title: "" });
      setExtraActionMode(false);
      return;
    }

    setDraftActions((current) => [
      ...current,
      {
        draftId: `${goal.id}-${Date.now()}`,
        goalId: goal.id,
        milestoneId: form.milestoneId,
        title: form.title.trim(),
        description: "Planned during weekly setup.",
        estimatedTime: "30 minutes",
        priority: "medium",
        energyLevel: "medium",
        notes: "Selected from the weekly planning flow."
      }
    ]);
    updateGoalForm(goal.id, { title: "" });
  }

  function generateDraftActions(goal: Goal) {
    const goalMilestones = getGoalMilestones(goal.id);
    const goalActiveActions = activeWeekActions.filter((action) => action.goalId === goal.id);
    const remainingSlots = 3 - getGoalDrafts(goal.id).length - goalActiveActions.length;

    if (remainingSlots <= 0 || goalMilestones.length === 0) {
      return;
    }

    if (activeWeekActions.length > 0 && !extraActionMode) {
      return;
    }

    const suggestions = suggestWeeklyActionsForGoal(goal, goalMilestones).slice(0, remainingSlots);
    if (extraActionMode) {
      addWeeklyActions(
        suggestions.slice(0, 1).map((suggestion, index) => ({
          id: getActionId(goal.id, suggestion.title, goalActiveActions.length + index),
          goalId: goal.id,
          milestoneId: suggestion.milestoneId,
          title: suggestion.title,
          description: suggestion.description,
          weekStartDate,
          completed: false,
          estimatedTime: suggestion.estimatedTime,
          priority: suggestion.priority,
          energyLevel: suggestion.energyLevel,
          notes: suggestion.notes,
          activeWeek: true,
          weekLocked: true
        }))
      );
      setExtraActionMode(false);
      return;
    }

    const nextDrafts = suggestions.map((suggestion, index) => ({
      draftId: `${goal.id}-generated-${Date.now()}-${index}`,
      goalId: goal.id,
      milestoneId: suggestion.milestoneId,
      title: suggestion.title,
      description: suggestion.description,
      estimatedTime: suggestion.estimatedTime,
      priority: suggestion.priority,
      energyLevel: suggestion.energyLevel,
      notes: suggestion.notes
    }));

    setDraftActions((current) => [...current, ...nextDrafts]);
  }

  function removeDraftAction(draftId: string) {
    setDraftActions((current) => current.filter((action) => action.draftId !== draftId));
  }

  function startWeek() {
    if (!canStartWeek) {
      return;
    }

    const lockedActions: WeeklyAction[] = draftActions.map((action, index) => ({
      id: getActionId(action.goalId, action.title, index),
      goalId: action.goalId,
      milestoneId: action.milestoneId,
      title: action.title,
      description: action.description,
      weekStartDate,
      completed: false,
      estimatedTime: action.estimatedTime,
      priority: action.priority,
      energyLevel: action.energyLevel,
      notes: action.notes,
      activeWeek: true,
      weekLocked: true
    }));

    addWeeklyActions(lockedActions);
    setDraftActions([]);
    setWeekCompleted(false);
  }

  function toggleActiveAction(action: WeeklyAction) {
    setWeeklyActionCompleted(action.id, !action.completed);
  }

  const activeWeekActionsWithLabels = activeWeekActions.map((action) => ({
    ...action,
    goalTitle: goalsById.get(action.goalId)?.title ?? "Unknown goal",
    milestoneTitle: getMilestoneTitle(milestonesById, action.milestoneId)
  }));

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase text-leaf">Weekly Plan</p>
          <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">
            {activeWeekActions.length > 0 ? "Active week" : "Plan this week"}
          </h1>
          <p className="mt-2 max-w-2xl text-ink/70">
            Select or generate one to three weekly actions per active goal, then start the week to lock them in.
          </p>
        </div>
        <div className="rounded-lg border border-line bg-white p-3 shadow-sm">
          <p className="text-xs font-semibold uppercase text-ink/60">Week start</p>
          <p className="mt-1 font-semibold">{formatDate(weekStartDate)}</p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-line bg-white p-4 shadow-sm">
          <p className="text-sm text-ink/60">Active goals</p>
          <p className="mt-1 text-2xl font-semibold">{activeGoals.length}</p>
        </div>
        <div className="rounded-lg border border-line bg-white p-4 shadow-sm">
          <p className="text-sm text-ink/60">Incomplete milestones</p>
          <p className="mt-1 text-2xl font-semibold">{incompleteMilestones.length}</p>
        </div>
        <div className="rounded-lg border border-line bg-white p-4 shadow-sm">
          <p className="text-sm text-ink/60">Active week actions</p>
          <p className="mt-1 text-2xl font-semibold">{activeWeekActions.length}</p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-line bg-white p-4 shadow-sm">
          <p className="text-sm text-ink/60">Actions completed this week</p>
          <p className="mt-1 text-2xl font-semibold">{executionStats.completedActions}</p>
        </div>
        <div className="rounded-lg border border-line bg-white p-4 shadow-sm">
          <p className="text-sm text-ink/60">Active days this week</p>
          <p className="mt-1 text-2xl font-semibold">{executionStats.activeDays}</p>
        </div>
        <div className="rounded-lg border border-line bg-white p-4 shadow-sm">
          <p className="text-sm text-ink/60">Current streak</p>
          <p className={`mt-1 text-2xl font-semibold ${currentStreak > 0 ? "text-success" : ""}`}>
            {currentStreak > 0 ? "+ " : ""}
            {currentStreak}
          </p>
        </div>
      </section>

      {activeGoals.length === 0 ? (
        <EmptyState
          headline="No active goals to plan"
          guidance="Create a goal or set an existing goal to active before building a weekly plan."
          actions={[
            { label: "Create goal", href: "/goals/new" },
            { label: "View goals", href: "/goals", variant: "secondary" }
          ]}
        />
      ) : (
        <section className="grid gap-4 lg:grid-cols-2">
          {activeGoals.map((goal) => {
          const goalMilestones = getGoalMilestones(goal.id);

          return (
            <article key={goal.id} className="rounded-lg border border-line bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-leaf">Active goal</p>
                  <Link
                    href={`/goals/${goal.id}`}
                    className="mt-1 block text-base font-semibold text-ink transition hover:text-leaf"
                  >
                    {goal.title}
                  </Link>
                </div>
                <span className="rounded-md bg-sky px-2 py-1 text-sm font-semibold">
                  {goalMilestones.length} open
                </span>
              </div>
              {goalMilestones.length > 0 ? (
                <ul className="mt-4 space-y-2">
                  {goalMilestones.map((milestone) => (
                    <li key={milestone.id} className="rounded-md border border-line bg-paper p-3 text-sm text-ink/70">
                      {milestone.title}
                      <span className="text-ink/50"> - due {formatDate(milestone.dueDate)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-4">
                  <EmptyState
                    headline="No incomplete milestones"
                    guidance="This goal has no open checkpoints. Add or suggest milestones on the goal detail page before planning actions."
                    actions={[
                      { label: "Open goal", href: `/goals/${goal.id}` }
                    ]}
                  />
                </div>
              )}
            </article>
          );
          })}
        </section>
      )}

      {activeWeekActions.length === 0 && draftActions.length === 0 ? (
        <EmptyState
          headline="🗓 No plan for this week"
          guidance="A week without a plan is a week that drifts.

Lock in 1–3 actions per goal to stay on track."
          actions={[
            { label: "Start planning", href: "#draft-weekly-actions" }
          ]}
        />
      ) : null}

      {activeWeekActions.length > 0 ? (
        <section className="rounded-lg border border-line bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-base font-semibold">Complete Week</h2>
              <p className="mt-1 text-sm text-ink/60">
                {completedActiveActions}/{activeWeekActions.length} actions complete
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-sky px-3 py-2 text-sm font-semibold">{completionPercentage}%</span>
              <span className="rounded-md border border-line bg-paper px-3 py-2 text-sm font-semibold">{feedback}</span>
              <button
                type="button"
                onClick={() => setWeekCompleted(true)}
                className="rounded-md bg-leaf px-3 py-2 text-sm font-semibold text-white transition hover:bg-ink"
              >
                Complete Week
              </button>
            </div>
          </div>
          {weekCompleted ? (
            <p className="mt-4 rounded-lg border border-line bg-paper p-4 text-sm text-ink/70">
              Week reviewed: {feedback}. Keep the active actions checked here as you finish the week.
            </p>
          ) : null}
          {allActiveWeekActionsCompleted ? (
            <div className="mt-4">
              <EmptyState
                headline="🔥 Strong finish"
                guidance="You completed all planned actions this week.

You can:
- stay ahead by adding more
- or lock this in and recover"
                actions={[
                  { label: "Add extra action", onClick: () => setExtraActionMode(true) },
                  { label: "Complete week", onClick: () => setWeekCompleted(true), variant: "secondary" }
                ]}
              />
            </div>
          ) : null}
        </section>
      ) : null}

      {activeWeekActions.length === 0 || extraActionMode ? (
        <section id="draft-weekly-actions" className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">{extraActionMode ? "Add extra action" : "Draft weekly actions"}</h2>
              <p className="mt-1 text-sm text-ink/60">
                {extraActionMode
                  ? "Choose one more action to stay ahead this week."
                  : "Draft actions are not saved until you start the week."}
              </p>
            </div>
            <button
              type="button"
              onClick={startWeek}
              disabled={!canStartWeek || extraActionMode}
              className="rounded-md bg-leaf px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-ink disabled:cursor-not-allowed disabled:bg-line disabled:text-ink/50"
            >
              Start Week
            </button>
          </div>

          {activeGoals.length === 0 ? (
            <EmptyState
              headline="No goals available for weekly actions"
              guidance="Weekly actions need an active goal and at least one incomplete milestone."
              actions={[
                { label: "Create goal", href: "/goals/new" },
                { label: "View goals", href: "/goals", variant: "secondary" }
              ]}
            />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {activeGoals.map((goal) => {
              const goalMilestones = getGoalMilestones(goal.id);
              const goalDrafts = getGoalDrafts(goal.id);
              const goalActiveActions = activeWeekActions.filter((action) => action.goalId === goal.id);
              const form = getGoalForm(goal);
              const goalLimitReached = goalDrafts.length + goalActiveActions.length >= 3;
              const canAdd = Boolean(form.title.trim() && form.milestoneId && !goalLimitReached);
              const canGenerate = goalMilestones.length > 0 && !goalLimitReached;

              return (
                <article key={goal.id} className="rounded-lg border border-line bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase text-leaf">Active goal</p>
                      <Link
                        href={`/goals/${goal.id}`}
                        className="mt-1 block text-base font-semibold text-ink transition hover:text-leaf"
                      >
                        {goal.title}
                      </Link>
                    </div>
                    <span className="rounded-md bg-sky px-2 py-1 text-sm font-semibold">
                      {goalDrafts.length}/3
                    </span>
                  </div>

                  <div className="mt-4 rounded-lg border border-line bg-paper p-3">
                    <p className="text-sm font-semibold">Incomplete milestones</p>
                    {goalMilestones.length > 0 ? (
                      <ul className="mt-2 space-y-2">
                        {goalMilestones.map((milestone) => (
                          <li key={milestone.id} className="text-sm text-ink/70">
                            {milestone.title}
                            <span className="text-ink/50"> - due {formatDate(milestone.dueDate)}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="mt-2">
                        <EmptyState
                          headline="No milestones ready for planning"
                          guidance="Add an incomplete milestone before selecting weekly actions for this goal."
                          actions={[
                            { label: "Open goal", href: `/goals/${goal.id}` }
                          ]}
                        />
                      </div>
                    )}
                  </div>

                  <div className="mt-4 grid gap-3">
                    <label className="block">
                      <span className="text-sm font-medium">Action</span>
                      <input
                        value={form.title}
                        onChange={(event) => updateGoalForm(goal.id, { title: event.target.value })}
                        placeholder="Name a concrete action"
                        disabled={goalLimitReached || goalMilestones.length === 0}
                        className="mt-2 w-full rounded-md border border-line bg-paper px-3 py-2 text-sm outline-leaf disabled:cursor-not-allowed disabled:text-ink/40"
                      />
                    </label>

                    <label className="block">
                      <span className="text-sm font-medium">Milestone</span>
                      <select
                        value={form.milestoneId}
                        onChange={(event) => updateGoalForm(goal.id, { milestoneId: event.target.value })}
                        disabled={goalLimitReached || goalMilestones.length === 0}
                        className="mt-2 w-full rounded-md border border-line bg-paper px-3 py-2 text-sm outline-leaf disabled:cursor-not-allowed disabled:text-ink/40"
                      >
                        {goalMilestones.map((milestone) => (
                          <option key={milestone.id} value={milestone.id}>
                            {milestone.title}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <button
                        type="button"
                        onClick={() => addDraftAction(goal)}
                        disabled={!canAdd}
                        className="rounded-md bg-leaf px-3 py-2 text-sm font-semibold text-white transition hover:bg-ink disabled:cursor-not-allowed disabled:bg-line disabled:text-ink/50"
                      >
                        Select action
                      </button>
                      <button
                        type="button"
                        onClick={() => generateDraftActions(goal)}
                        disabled={!canGenerate}
                        className="rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-ink/70 transition hover:border-leaf hover:text-leaf disabled:cursor-not-allowed disabled:bg-line disabled:text-ink/50"
                      >
                        Generate actions
                      </button>
                    </div>
                  </div>

                  {goalDrafts.length > 0 ? (
                    <ul className="mt-4 space-y-2">
                      {goalDrafts.map((action) => (
                        <li key={action.draftId} className="rounded-lg border border-line bg-paper p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold">{action.title}</p>
                              <p className="mt-1 text-xs text-ink/60">
                                Milestone: {getMilestoneTitle(milestonesById, action.milestoneId)}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeDraftAction(action.draftId)}
                              className="text-sm font-semibold text-clay hover:text-ink"
                            >
                              Remove
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </article>
              );
              })}
            </div>
          )}
        </section>
      ) : null}

      <section>
        <div className="rounded-lg border border-line bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold">Active Week Actions</h2>
          {activeWeekActionsWithLabels.length > 0 ? (
            <ul className="mt-4 space-y-3">
              {activeWeekActionsWithLabels.map((action) => (
                <li
                  key={action.id}
                  className={`rounded-lg border p-3 ${
                    action.completed ? "border-success/30 bg-successSoft" : "border-line bg-paper"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={action.completed}
                      onChange={() => toggleActiveAction(action)}
                      aria-label={`${action.title} completed`}
                      className="mt-1 h-4 w-4 rounded border-line accent-leaf"
                    />
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/goals/${action.goalId}/actions/${action.id}`}
                        className="font-medium text-ink transition hover:text-leaf"
                      >
                        {action.title}
                      </Link>
                      <p className="mt-1 text-sm text-ink/60">{action.goalTitle}</p>
                      <p className="mt-1 text-xs text-ink/50">Milestone: {action.milestoneTitle}</p>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 rounded-md border border-line bg-white p-3">
                    <EditableText
                      label="Action title"
                      value={action.title}
                      required
                      onSave={(title) => updateWeeklyAction(action.id, { title })}
                    />
                    <EditableDate
                      label="Week start"
                      value={action.weekStartDate}
                      required
                      onSave={(weekStartDate) => updateWeeklyAction(action.id, { weekStartDate })}
                    />
                    <EditableTextarea
                      label="Notes"
                      value={action.notes ?? ""}
                      emptyText="No notes yet."
                      onSave={(notes) => updateWeeklyAction(action.id, { notes: notes || undefined })}
                    />
                    <div>
                      <button
                        type="button"
                        onClick={() => {
                          const confirmed = window.confirm("Delete this weekly action?");

                          if (confirmed) {
                            removeWeeklyAction(action.id);
                          }
                        }}
                        className="rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-clay transition hover:border-clay hover:bg-white"
                      >
                        Delete action
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-4">
              <EmptyState
                headline="No weekly actions locked in"
                guidance="Select or generate one to three actions for at least one active goal, then start the week."
                actions={[
                  { label: "Create goal", href: "/goals/new" },
                  { label: "View goals", href: "/goals", variant: "secondary" }
                ]}
              />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
