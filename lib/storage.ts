import type { ExecutionLog, Goal, Milestone, WeeklyAction } from "@/lib/models";

export const goalCalendarStorageKey = "goal-calendar-demo-data";
export const goalCalendarResetEvent = "goal-calendar-reset-demo-data";

export type GoalCalendarData = {
  goals: Goal[];
  milestones: Milestone[];
  weeklyActions: WeeklyAction[];
  executionLogs: ExecutionLog[];
};
