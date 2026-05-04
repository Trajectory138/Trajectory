"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { EmptyState } from "@/components/EmptyState";
import { getDaysUntilDate, parseGoalDate } from "@/lib/dateProgress";
import {
  getCurrentStreak,
  getCurrentWeekStartDate,
  getExecutionLogForDate,
  getTodayDateKey,
  hasExecutionHistory
} from "@/lib/executionTracking";
import { getGoalTrajectory } from "@/lib/trajectory";
import { useGoalCalendarData } from "@/lib/useGoalCalendarData";

const trajectoryStyles = {
  ahead: "border-success bg-successSoft text-success",
  "on-track": "border-warning bg-warningSoft text-warning",
  behind: "border-danger bg-dangerSoft text-danger"
};

type CompletedMove = {
  id: string;
  title: string;
  goalTitle: string;
  milestoneTitle: string;
  completedAt: string;
  note: string;
};

function getTodayAtNoon(currentDate = new Date()) {
  return new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 12);
}

function formatFullDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

export function Dashboard() {
  const {
    goals,
    milestones,
    getWeeklyActionsWithLabels,
    getMilestonesForGoal,
    setWeeklyActionCompleted,
    executionLogs
  } = useGoalCalendarData();
  const [executionNote, setExecutionNote] = useState("");
  const [completedMoves, setCompletedMoves] = useState<CompletedMove[]>([]);
  const [recentlyCompletedMoveId, setRecentlyCompletedMoveId] = useState<string | undefined>(undefined);
  const [showMoveLogged, setShowMoveLogged] = useState(false);
  const moveLoggedTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const moveAdvanceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const today = getTodayAtNoon();
  const todayLabel = formatFullDate(today);
  const weekStartDate = getCurrentWeekStartDate(today);
  const todayDate = getTodayDateKey(today);
  const todayLog = getExecutionLogForDate(executionLogs, todayDate);
  const weeklyActionsWithLabels = getWeeklyActionsWithLabels();
  const currentWeekActions = weeklyActionsWithLabels.filter((action) => action.weekStartDate === weekStartDate);
  const scheduledActions = currentWeekActions.length > 0 ? currentWeekActions : weeklyActionsWithLabels;
  const incompleteActions = scheduledActions.filter((action) => !action.completed);
  const allScheduledActionsCompleted = scheduledActions.length > 0 && incompleteActions.length === 0;
  const recentlyCompletedMove = recentlyCompletedMoveId
    ? scheduledActions.find((action) => action.id === recentlyCompletedMoveId)
    : undefined;
  const todayMove = recentlyCompletedMove ?? incompleteActions[0];
  const isTodayMoveCompleted = Boolean(
    todayMove && recentlyCompletedMoveId === todayMove.id
  );
  const upNext = incompleteActions.filter((action) => action.id !== todayMove?.id).slice(0, 3);
  const goal = todayMove ? goals.find((item) => item.id === todayMove.goalId) : undefined;
  const milestone = todayMove
    ? milestones.find((item) => item.id === todayMove.milestoneId && item.goalId === todayMove.goalId)
    : undefined;
  const goalMilestones = goal ? getMilestonesForGoal(goal.id) : [];
  const targetDate = milestone?.dueDate || goal?.targetDate;
  const hasTargetDate = Boolean(parseGoalDate(targetDate));
  const daysRemaining = hasTargetDate ? Math.max(getDaysUntilDate(targetDate, today), 0) : undefined;
  const trajectory = goal ? getGoalTrajectory(goal, goalMilestones, today) : undefined;
  const storedCurrentStreak = getCurrentStreak(executionLogs, todayDate);
  const storedTodayCompletedCount = todayLog?.completedCount ?? 0;
  const completedMoveAlreadyCounted = Boolean(
    todayMove && todayLog?.completedActionIds.includes(todayMove.id)
  );
  const hasOptimisticCompletion = isTodayMoveCompleted && !completedMoveAlreadyCounted;
  const currentStreak = storedCurrentStreak + (hasOptimisticCompletion && storedTodayCompletedCount === 0 ? 1 : 0);
  const todayCompletedCount = storedTodayCompletedCount + (hasOptimisticCompletion ? 1 : 0);
  const trajectoryStyle = trajectory ? trajectoryStyles[trajectory.status] : trajectoryStyles["on-track"];

  function markTodayMoveComplete() {
    if (!todayMove || isTodayMoveCompleted) {
      return;
    }

    const progressNote = executionNote.trim();

    setRecentlyCompletedMoveId(todayMove.id);
    setCompletedMoves((current) => {
      if (current.some((move) => move.id === todayMove.id)) {
        return current;
      }

      return [
        {
          id: todayMove.id,
          title: todayMove.title,
          goalTitle: goal?.title ?? todayMove.goalTitle,
          milestoneTitle: milestone?.title ?? todayMove.milestoneTitle ?? "Unknown milestone",
          completedAt: todayLabel,
          note: progressNote
        },
        ...current
      ];
    });
    setWeeklyActionCompleted(todayMove.id, true, executionNote);
    setShowMoveLogged(true);

    if (moveLoggedTimer.current) {
      clearTimeout(moveLoggedTimer.current);
    }

    moveLoggedTimer.current = setTimeout(() => {
      setShowMoveLogged(false);
    }, 1000);

    if (moveAdvanceTimer.current) {
      clearTimeout(moveAdvanceTimer.current);
    }

    moveAdvanceTimer.current = setTimeout(() => {
      setRecentlyCompletedMoveId(undefined);
      setExecutionNote("");
    }, 1000);
  }

  useEffect(() => {
    return () => {
      if (moveLoggedTimer.current) {
        clearTimeout(moveLoggedTimer.current);
      }

      if (moveAdvanceTimer.current) {
        clearTimeout(moveAdvanceTimer.current);
      }
    };
  }, []);

  const executionNoteField = (
    <label className="mt-4 block max-w-2xl">
      <span className="text-sm font-medium">What moved forward today?</span>
      <textarea
        value={executionNote}
        onChange={(event) => setExecutionNote(event.target.value)}
        rows={3}
        className="mt-2 w-full rounded-md border border-line bg-paper px-3 py-2 text-sm outline-leaf"
        placeholder="Add a quick note about today’s progress."
      />
    </label>
  );

  const executionStatusStrip = (
    <section className="rounded-lg border border-line bg-white p-2.5 shadow-sm sm:px-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-md border border-line bg-paper px-2.5 py-1.5">
            <span className="text-[11px] font-semibold uppercase text-ink/60">Current streak</span>
            <span className={`inline-flex items-center gap-1 text-sm font-semibold ${currentStreak > 0 ? "text-success" : "text-ink"}`}>
              <span aria-hidden="true" className="text-xs leading-none">🔥</span>
              <span>
                {currentStreak > 0 ? "+ " : ""}
                {currentStreak} days
              </span>
            </span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-md border border-line bg-paper px-2.5 py-1.5">
            <span className="text-[11px] font-semibold uppercase text-ink/60">Tasks completed</span>
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-ink">
              <span aria-hidden="true" className="text-xs leading-none">✓</span>
              <span>{todayCompletedCount}</span>
            </span>
          </div>
        </div>
        <p
          className={`min-h-5 text-sm font-semibold text-leaf transition-opacity duration-300 ${
            showMoveLogged ? "opacity-100" : "opacity-0"
          }`}
          aria-live="polite"
        >
          Move completed
        </p>
      </div>

      {!hasExecutionHistory(executionLogs) ? (
        <p className="mt-2 text-sm text-ink/60">
          Complete one meaningful action today to begin your execution history.
        </p>
      ) : null}
    </section>
  );

  const completedMovesSection = completedMoves.length > 0 ? (
    <section className="rounded-lg border border-line bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">Completed today</h2>
        <span className="rounded-md border border-line bg-paper px-2 py-1 text-xs font-semibold text-ink/60">
          {completedMoves.length}
        </span>
      </div>
      <ul className="mt-3 divide-y divide-line">
        {completedMoves.map((move) => (
          <li key={move.id} className="py-3 first:pt-0 last:pb-0">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-medium text-ink">{move.title}</p>
                <p className="mt-1 text-sm text-ink/60">
                  {move.goalTitle} · {move.milestoneTitle}
                </p>
                {move.note ? (
                  <p className="mt-2 rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink/70">
                    {move.note}
                  </p>
                ) : null}
              </div>
              <p className="shrink-0 text-sm text-ink/50">{move.completedAt}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  ) : null;

  if (goals.length === 0) {
    return (
      <main className="space-y-6">
        {executionStatusStrip}
        <section className="rounded-lg border border-line bg-white p-6 shadow-sm">
          <EmptyState
            headline="🚀 Start your first mission"
            guidance="You don’t have any goals yet.
Create one to begin tracking progress and building momentum."
            actions={[
              { label: "+ Create goal", href: "/goals/new" }
            ]}
          />
        </section>
      </main>
    );
  }

  if (!todayMove || !goal) {
    return (
      <main className="space-y-6">
        {executionStatusStrip}
        <section className="rounded-lg border border-line bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase text-leaf">Today&apos;s Move</p>
          <p className="mt-2 text-sm text-ink/60">{todayLabel}</p>
          <div className="mt-5">
            {allScheduledActionsCompleted ? (
              <EmptyState
                headline="🔥 Strong finish"
                guidance="You completed all planned actions this week.

You can:
- stay ahead by adding more
- or lock this in and recover"
                actions={[
                  { label: "Add extra action", href: "/weekly-plan" },
                  { label: "Complete week", href: "/weekly-plan", variant: "secondary" }
                ]}
              />
            ) : (
              <EmptyState
                headline="No move scheduled today"
                guidance="Plan a focused action for the current week, or open a goal and generate a suggested action from its milestones."
                actions={[
                  { label: "Plan today", href: "/weekly-plan" },
                  { label: "Suggest action", href: "/goals", variant: "secondary" }
                ]}
              />
            )}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="space-y-6">
      {executionStatusStrip}
      <section className="rounded-lg border border-line border-l-4 border-l-leaf bg-successSoft/40 p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-6">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold uppercase text-leaf">Today&apos;s Move</p>
            <p className="mt-2 text-sm text-ink/60">{todayLabel}</p>
            <h1 className="mt-3 text-2xl font-semibold sm:text-4xl">{todayMove.title}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/70">
              One focused action for the current week. Finish this before reaching for the next thing.
            </p>
            {executionNoteField}
            <button
              type="button"
              onClick={markTodayMoveComplete}
              disabled={isTodayMoveCompleted}
              className={`mt-3 inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold shadow-sm transition ${
                isTodayMoveCompleted
                  ? "cursor-default bg-success text-white"
                  : "bg-leaf text-white hover:bg-ink"
              }`}
            >
              {isTodayMoveCompleted ? "Completed ✔" : "Mark complete"}
            </button>
          </div>

          <div className="w-full shrink-0 rounded-lg border border-line/70 bg-white/50 p-4 lg:max-w-xs">
            <div>
              <p className="text-[11px] font-medium uppercase text-ink/50">Goal</p>
              <Link href={`/goals/${goal.id}`} className="mt-1 block text-sm font-semibold text-ink/80 transition hover:text-leaf">
                {goal.title}
              </Link>
            </div>
            <div className="mt-3 border-t border-line/70 pt-3">
              <p className="text-[11px] font-medium uppercase text-ink/50">Milestone</p>
              {milestone ? (
                <Link
                  href={`/goals/${goal.id}/milestones/${milestone.id}`}
                  className="mt-1 block text-sm font-semibold text-ink/80 transition hover:text-leaf"
                >
                  {milestone.title}
                </Link>
              ) : (
                <p className="mt-1 text-sm font-semibold text-ink/60">Unknown milestone</p>
              )}
            </div>
            <div className="mt-3 border-t border-line/70 pt-3">
              <p className="text-[11px] font-medium uppercase text-ink/50">Days remaining</p>
              {daysRemaining === undefined ? (
                <p className="mt-1 text-sm font-semibold text-ink/60">No target date</p>
              ) : (
                <p className="mt-1 text-xl font-semibold text-ink/80">{daysRemaining}</p>
              )}
            </div>
            <div className="mt-3 border-t border-line/70 pt-3">
              <p className="text-[11px] font-medium uppercase text-ink/50">Trajectory</p>
              <p className={`mt-1 inline-flex rounded-md border px-2 py-1 text-xs font-semibold ${trajectoryStyle}`}>
                {trajectory?.label ?? "On track"}
              </p>
              <p className="mt-1 text-sm text-ink/60">{trajectory?.message ?? "You are aligned with plan"}</p>
            </div>
          </div>
        </div>
      </section>

      {upNext.length > 0 ? (
        <section className="rounded-lg border border-line bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold">Up next</h2>
          <ul className="mt-3 divide-y divide-line">
            {upNext.map((action) => (
              <li key={action.id} className="py-3 first:pt-0 last:pb-0">
                <Link
                  href={`/goals/${action.goalId}/actions/${action.id}`}
                  className="font-medium text-ink transition hover:text-leaf"
                >
                  {action.title}
                </Link>
                <p className="mt-1 text-sm text-ink/60">
                  {action.goalTitle} · {action.milestoneTitle ?? "Unknown milestone"}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {completedMovesSection}
    </main>
  );
}
