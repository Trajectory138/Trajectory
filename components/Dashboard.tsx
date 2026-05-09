"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { EmptyState } from "@/components/EmptyState";
import { getDaysUntilDate, parseGoalDate } from "@/lib/dateProgress";
import {
  getCurrentWeekStartDate
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
    setWeeklyActionCompleted
  } = useGoalCalendarData();
  const [executionNote, setExecutionNote] = useState("");
  const [completedMoves, setCompletedMoves] = useState<CompletedMove[]>([]);
  const [recentlyCompletedMoveId, setRecentlyCompletedMoveId] = useState<string | undefined>(undefined);
  const [showMoveDetails, setShowMoveDetails] = useState(false);
  const [showMoveLogged, setShowMoveLogged] = useState(false);
  const moveLoggedTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const moveAdvanceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const today = getTodayAtNoon();
  const todayLabel = formatFullDate(today);
  const weekStartDate = getCurrentWeekStartDate(today);
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

  useEffect(() => {
    setShowMoveDetails(false);
  }, [todayMove?.id]);

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
      <section className="rounded-lg border border-line border-l-4 border-l-leaf bg-successSoft/40 p-5 shadow-sm sm:p-6">
        <p
          className={`mb-3 min-h-5 text-sm font-semibold text-leaf transition-opacity duration-300 ${
            showMoveLogged ? "opacity-100" : "opacity-0"
          }`}
          aria-live="polite"
        >
          Move completed
        </p>
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase text-leaf">Today&apos;s Move</p>
          <p className="mt-2 text-sm text-ink/60">{todayLabel}</p>
          <h1 className="mt-3 text-2xl font-semibold sm:text-4xl">{todayMove.title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/70">
            One focused action for the current week. Finish this before reaching for the next thing.
          </p>
          {executionNoteField}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={markTodayMoveComplete}
              disabled={isTodayMoveCompleted}
              className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold shadow-sm transition ${
                isTodayMoveCompleted
                  ? "cursor-default bg-success text-white"
                  : "bg-leaf text-white hover:bg-ink"
              }`}
            >
              {isTodayMoveCompleted ? "Completed ✔" : "Mark complete"}
            </button>
            <button
              type="button"
              onClick={() => setShowMoveDetails((current) => !current)}
              className="inline-flex items-center justify-center rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink/70 transition hover:border-leaf hover:text-leaf"
              aria-expanded={showMoveDetails}
            >
              Details
            </button>
          </div>
        </div>

        {showMoveDetails ? (
          <div className="mt-5 rounded-lg border border-line bg-white/70 p-4">
            <div className="flex flex-col gap-1 border-b border-line pb-3">
              <p className="text-xs font-semibold uppercase text-leaf">Move details</p>
              <p className="text-sm leading-6 text-ink/70">{todayMove.description}</p>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-[11px] font-medium uppercase text-ink/50">Goal</p>
                <Link
                  href={`/goals/${goal.id}`}
                  className="mt-1 block text-base font-semibold text-ink transition hover:text-leaf"
                >
                  {goal.title}
                </Link>
                <p className="mt-2 text-sm leading-6 text-ink/60">{goal.description}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase text-ink/50">Milestone</p>
                {milestone ? (
                  <>
                    <Link
                      href={`/goals/${goal.id}/milestones/${milestone.id}`}
                      className="mt-1 block text-base font-semibold text-ink transition hover:text-leaf"
                    >
                      {milestone.title}
                    </Link>
                    <p className="mt-2 text-sm leading-6 text-ink/60">{milestone.description}</p>
                  </>
                ) : (
                  <p className="mt-1 text-sm font-semibold text-ink/60">Unknown milestone</p>
                )}
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase text-ink/50">Days remaining</p>
                {daysRemaining === undefined ? (
                  <p className="mt-1 text-sm font-semibold text-ink/60">No target date</p>
                ) : (
                  <>
                    <p className="mt-1 text-2xl font-semibold text-ink">{daysRemaining}</p>
                    <p className="mt-1 text-sm text-ink/60">
                      Until {milestone?.dueDate ? "milestone due date" : "goal target date"}
                    </p>
                  </>
                )}
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase text-ink/50">Trajectory</p>
                <p className={`mt-1 inline-flex rounded-md border px-2 py-1 text-sm font-semibold ${trajectoryStyle}`}>
                  {trajectory?.label ?? "On track"}
                </p>
                <p className="mt-2 text-sm leading-6 text-ink/60">
                  {trajectory?.message ?? "You are aligned with plan"}
                </p>
              </div>
            </div>
          </div>
        ) : null}
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
