"use client";

import Link from "next/link";

import { EmptyState } from "@/components/EmptyState";
import { GoalCard } from "@/components/GoalCard";
import { ProgressSummary } from "@/components/ProgressSummary";
import { useGoalCalendarData } from "@/lib/useGoalCalendarData";
import type { ProgressSummary as ProgressSummaryModel } from "@/lib/models";

export function GoalsOverview() {
  const {
    goals,
    milestones,
    weeklyActions,
    getGoalProgress,
    updateGoal,
    deleteGoal
  } = useGoalCalendarData();

  const goalProgressValues = goals.map((goal) => getGoalProgress(goal.id));
  const summary: ProgressSummaryModel = {
    totalGoals: goals.length,
    activeGoals: goals.filter((goal) => goal.status === "active").length,
    completedMilestones: milestones.filter((milestone) => milestone.completed).length,
    totalMilestones: milestones.length,
    completedWeeklyActions: weeklyActions.filter((action) => action.completed).length,
    totalWeeklyActions: weeklyActions.length,
    averageProgress: goalProgressValues.length
      ? Math.round(goalProgressValues.reduce((total, progress) => total + progress, 0) / goalProgressValues.length)
      : 0
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase text-leaf">Goals</p>
          <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">Active goals</h1>
          <p className="mt-2 max-w-2xl text-ink/70">
            Track outcomes, target dates, and the next clear focus for each goal.
          </p>
        </div>
        <Link
          href="/goals/new"
          className="inline-flex items-center justify-center rounded-md bg-leaf px-3 py-2 text-sm font-semibold text-white transition hover:bg-ink"
        >
          Create goal
        </Link>
      </section>

      <ProgressSummary summary={summary} />

      {goals.length === 0 ? (
        <EmptyState
          headline="🚀 Start your first mission"
          guidance="You don’t have any goals yet.
Create one to begin tracking progress and building momentum."
          actions={[
            { label: "+ Create goal", href: "/goals/new" }
          ]}
        />
      ) : (
        <section className="grid gap-4 md:grid-cols-2">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              progress={getGoalProgress(goal.id)}
              onUpdateGoal={updateGoal}
              onDeleteGoal={deleteGoal}
            />
          ))}
        </section>
      )}
    </div>
  );
}
