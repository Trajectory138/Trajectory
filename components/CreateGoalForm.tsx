"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { Breadcrumbs } from "@/components/Breadcrumbs";
import { getCurrentWeekStartDate } from "@/lib/executionTracking";
import type { Goal, GoalStatus, Milestone, WeeklyAction } from "@/lib/models";
import { useGoalCalendarData } from "@/lib/useGoalCalendarData";

const statusOptions: Array<{ value: GoalStatus; label: string }> = [
  { value: "active", label: "Active" },
  { value: "not_started", label: "Not started" },
  { value: "paused", label: "Paused" },
  { value: "completed", label: "Completed" }
];

function createGoalId(title: string) {
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);

  return `${slug || "goal"}-${Date.now()}`;
}

export function CreateGoalForm() {
  const router = useRouter();
  const { addGoal, addMilestones, addWeeklyActions } = useGoalCalendarData();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [whyItMatters, setWhyItMatters] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [status, setStatus] = useState<GoalStatus>("active");
  const [milestoneTitle, setMilestoneTitle] = useState("");
  const [milestoneDescription, setMilestoneDescription] = useState("");
  const [milestoneDueDate, setMilestoneDueDate] = useState("");
  const [firstMoveTitle, setFirstMoveTitle] = useState("");
  const [firstMoveDescription, setFirstMoveDescription] = useState("");
  const [errors, setErrors] = useState<{
    title?: string;
    targetDate?: string;
    milestoneTitle?: string;
    milestoneDueDate?: string;
  }>({});

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const wantsFirstMove = Boolean(firstMoveTitle.trim());
    const wantsMilestone = Boolean(milestoneTitle.trim() || milestoneDescription.trim() || milestoneDueDate);
    const nextErrors = {
      title: title.trim() ? undefined : "Goal title is required.",
      targetDate: targetDate ? undefined : "Target date is required.",
      milestoneTitle: wantsFirstMove && !milestoneTitle.trim() ? "Add a milestone before scheduling a move." : undefined,
      milestoneDueDate: wantsMilestone && !milestoneDueDate && !targetDate ? "Milestone due date is required." : undefined
    };

    setErrors(nextErrors);

    if (nextErrors.title || nextErrors.targetDate) {
      return;
    }

    const id = createGoalId(title);
    const goal: Goal = {
      id,
      title: title.trim(),
      description: description.trim(),
      whyItMatters: whyItMatters.trim(),
      targetDate,
      status,
      createdAt: new Date().toISOString()
    };

    addGoal(goal);
    const firstMilestone: Milestone | undefined = milestoneTitle.trim()
      ? {
          id: createGoalId(`${title}-milestone-${milestoneTitle}`),
          goalId: id,
          title: milestoneTitle.trim(),
          description: milestoneDescription.trim() || "First milestone for this goal.",
          dueDate: milestoneDueDate || targetDate,
          completed: false,
          successCriteria: ["Milestone is complete"],
          blockers: [],
          nextStep: firstMoveTitle.trim() || "Choose the next concrete step."
        }
      : undefined;

    if (firstMilestone) {
      addMilestones([firstMilestone]);
    }

    if (firstMilestone && firstMoveTitle.trim()) {
      const firstMove: WeeklyAction = {
        id: createGoalId(`${title}-move-${firstMoveTitle}`),
        goalId: id,
        milestoneId: firstMilestone.id,
        title: firstMoveTitle.trim(),
        description: firstMoveDescription.trim() || "First move for this goal.",
        weekStartDate: getCurrentWeekStartDate(),
        completed: false,
        estimatedTime: "30 minutes",
        priority: "medium",
        energyLevel: "medium",
        notes: "Added from the create goal flow.",
        activeWeek: true,
        weekLocked: true
      };

      addWeeklyActions([firstMove]);
    }

    router.push(`/goals/${id}`);
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/" },
          { label: "Goals", href: "/goals" },
          { label: "Create goal" }
        ]}
      />

      <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase text-leaf">New Goal</p>
          <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">Create a goal</h1>
          <p className="mt-2 text-sm leading-6 text-ink/70">
            Set the target and the reason behind it. Milestones and weekly actions can come next.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-5">
          <label className="block">
            <span className="text-sm font-medium">Goal title</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              aria-invalid={Boolean(errors.title)}
              aria-describedby={errors.title ? "goal-title-error" : undefined}
              className="mt-2 w-full rounded-md border border-line bg-paper px-3 py-2 text-sm outline-leaf"
            />
            {errors.title ? <p id="goal-title-error" className="mt-2 text-sm text-clay">{errors.title}</p> : null}
          </label>

          <label className="block">
            <span className="text-sm font-medium">Description</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              className="mt-2 w-full rounded-md border border-line bg-paper px-3 py-2 text-sm outline-leaf"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">Why it matters</span>
            <textarea
              value={whyItMatters}
              onChange={(event) => setWhyItMatters(event.target.value)}
              rows={4}
              className="mt-2 w-full rounded-md border border-line bg-paper px-3 py-2 text-sm outline-leaf"
            />
          </label>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium">Target date</span>
              <input
                type="date"
                value={targetDate}
                onChange={(event) => setTargetDate(event.target.value)}
                aria-invalid={Boolean(errors.targetDate)}
                aria-describedby={errors.targetDate ? "target-date-error" : undefined}
                className="mt-2 w-full rounded-md border border-line bg-paper px-3 py-2 text-sm outline-leaf"
              />
              {errors.targetDate ? (
                <p id="target-date-error" className="mt-2 text-sm text-clay">{errors.targetDate}</p>
              ) : null}
            </label>

            <label className="block">
              <span className="text-sm font-medium">Status</span>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as GoalStatus)}
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

          <section className="rounded-lg border border-line bg-paper p-4">
            <div>
              <h2 className="text-base font-semibold">First milestone</h2>
              <p className="mt-1 text-sm text-ink/60">
                Add the first checkpoint so this goal can move from idea to execution.
              </p>
            </div>
            <div className="mt-4 grid gap-4">
              <label className="block">
                <span className="text-sm font-medium">Milestone title</span>
                <input
                  value={milestoneTitle}
                  onChange={(event) => setMilestoneTitle(event.target.value)}
                  aria-invalid={Boolean(errors.milestoneTitle)}
                  aria-describedby={errors.milestoneTitle ? "milestone-title-error" : undefined}
                  placeholder="e.g. Build the first working version"
                  className="mt-2 w-full rounded-md border border-line bg-white px-3 py-2 text-sm outline-leaf"
                />
                {errors.milestoneTitle ? (
                  <p id="milestone-title-error" className="mt-2 text-sm text-clay">{errors.milestoneTitle}</p>
                ) : null}
              </label>

              <label className="block">
                <span className="text-sm font-medium">Milestone description</span>
                <textarea
                  value={milestoneDescription}
                  onChange={(event) => setMilestoneDescription(event.target.value)}
                  rows={3}
                  className="mt-2 w-full rounded-md border border-line bg-white px-3 py-2 text-sm outline-leaf"
                />
              </label>

              <label className="block sm:max-w-xs">
                <span className="text-sm font-medium">Due date</span>
                <input
                  type="date"
                  value={milestoneDueDate}
                  onChange={(event) => setMilestoneDueDate(event.target.value)}
                  aria-invalid={Boolean(errors.milestoneDueDate)}
                  aria-describedby={errors.milestoneDueDate ? "milestone-due-date-error" : undefined}
                  className="mt-2 w-full rounded-md border border-line bg-white px-3 py-2 text-sm outline-leaf"
                />
                {errors.milestoneDueDate ? (
                  <p id="milestone-due-date-error" className="mt-2 text-sm text-clay">{errors.milestoneDueDate}</p>
                ) : (
                  <p className="mt-2 text-xs text-ink/50">If blank, the goal target date will be used.</p>
                )}
              </label>
            </div>
          </section>

          <section className="rounded-lg border border-line bg-paper p-4">
            <div>
              <h2 className="text-base font-semibold">First move</h2>
              <p className="mt-1 text-sm text-ink/60">
                Schedule one concrete action for this week so it can appear in Today’s Move.
              </p>
            </div>
            <div className="mt-4 grid gap-4">
              <label className="block">
                <span className="text-sm font-medium">Move title</span>
                <input
                  value={firstMoveTitle}
                  onChange={(event) => setFirstMoveTitle(event.target.value)}
                  placeholder="e.g. Draft the homepage outline"
                  className="mt-2 w-full rounded-md border border-line bg-white px-3 py-2 text-sm outline-leaf"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium">Move details</span>
                <textarea
                  value={firstMoveDescription}
                  onChange={(event) => setFirstMoveDescription(event.target.value)}
                  rows={3}
                  className="mt-2 w-full rounded-md border border-line bg-white px-3 py-2 text-sm outline-leaf"
                />
              </label>
            </div>
          </section>

          <div className="flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center">
            <button
              type="submit"
              className="rounded-md bg-leaf px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink"
            >
              Create goal
            </button>
            <button
              type="button"
              onClick={() => router.push("/goals")}
              className="rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink/70 transition hover:border-leaf hover:text-leaf"
            >
              Cancel
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
