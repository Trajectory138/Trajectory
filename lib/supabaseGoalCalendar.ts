import type { ExecutionLog, Goal, Milestone, WeeklyAction } from "@/lib/models";
import { supabase } from "@/lib/supabase";
import type { GoalCalendarData } from "@/lib/storage";

type GoalRow = {
  id: string;
  user_id?: string;
  title: string;
  description: string | null;
  why_it_matters: string | null;
  target_date: string;
  status: Goal["status"];
  created_at: string;
};

type MilestoneRow = {
  id: string;
  user_id?: string;
  goal_id: string;
  title: string;
  description: string | null;
  due_date: string;
  completed: boolean;
  success_criteria: string[] | null;
  blockers: string[] | null;
  next_step: string | null;
  notes: string | null;
};

type WeeklyActionRow = {
  id: string;
  user_id?: string;
  goal_id: string;
  milestone_id: string;
  title: string;
  description: string | null;
  week_start_date: string;
  completed: boolean;
  estimated_time: string | null;
  priority: WeeklyAction["priority"] | null;
  energy_level: WeeklyAction["energyLevel"] | null;
  notes: string | null;
  active_week: boolean | null;
  week_locked: boolean | null;
};

type ExecutionLogRow = {
  id: string;
  user_id?: string;
  date: string;
  completed_action_ids: string[] | null;
  completed_count: number | null;
  note: string | null;
  created_at: string;
};

export function hasSupabaseConfig() {
  return Boolean(supabase);
}

async function getCurrentUserId() {
  if (!supabase) {
    return undefined;
  }

  const { data, error } = await supabase.auth.getUser();

  if (error) {
    console.error("Unable to read Supabase user.", error);
    return undefined;
  }

  return data.user?.id;
}

function toGoal(row: GoalRow): Goal {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    whyItMatters: row.why_it_matters ?? "",
    targetDate: row.target_date,
    status: row.status,
    createdAt: row.created_at
  };
}

function toGoalRow(goal: Goal, userId: string): GoalRow {
  return {
    id: goal.id,
    user_id: userId,
    title: goal.title,
    description: goal.description,
    why_it_matters: goal.whyItMatters,
    target_date: goal.targetDate,
    status: goal.status,
    created_at: goal.createdAt
  };
}

function toMilestone(row: MilestoneRow): Milestone {
  return {
    id: row.id,
    goalId: row.goal_id,
    title: row.title,
    description: row.description ?? "",
    dueDate: row.due_date,
    completed: row.completed,
    successCriteria: row.success_criteria ?? [],
    blockers: row.blockers ?? [],
    nextStep: row.next_step ?? "",
    notes: row.notes ?? undefined
  };
}

function toMilestoneRow(milestone: Milestone, userId: string): MilestoneRow {
  return {
    id: milestone.id,
    user_id: userId,
    goal_id: milestone.goalId,
    title: milestone.title,
    description: milestone.description,
    due_date: milestone.dueDate,
    completed: milestone.completed,
    success_criteria: milestone.successCriteria,
    blockers: milestone.blockers,
    next_step: milestone.nextStep,
    notes: milestone.notes ?? null
  };
}

function toWeeklyAction(row: WeeklyActionRow): WeeklyAction {
  return {
    id: row.id,
    goalId: row.goal_id,
    milestoneId: row.milestone_id,
    title: row.title,
    description: row.description ?? "",
    weekStartDate: row.week_start_date,
    completed: row.completed,
    estimatedTime: row.estimated_time ?? "30 minutes",
    priority: row.priority ?? "medium",
    energyLevel: row.energy_level ?? "medium",
    notes: row.notes ?? undefined,
    activeWeek: row.active_week ?? false,
    weekLocked: row.week_locked ?? false
  };
}

function toWeeklyActionRow(action: WeeklyAction, userId: string): WeeklyActionRow {
  return {
    id: action.id,
    user_id: userId,
    goal_id: action.goalId,
    milestone_id: action.milestoneId,
    title: action.title,
    description: action.description,
    week_start_date: action.weekStartDate,
    completed: action.completed,
    estimated_time: action.estimatedTime,
    priority: action.priority,
    energy_level: action.energyLevel,
    notes: action.notes ?? null,
    active_week: action.activeWeek ?? false,
    week_locked: action.weekLocked ?? false
  };
}

function toExecutionLog(row: ExecutionLogRow): ExecutionLog {
  return {
    id: row.id,
    date: row.date,
    completedActionIds: row.completed_action_ids ?? [],
    completedCount: row.completed_count ?? 0,
    note: row.note ?? "",
    createdAt: row.created_at
  };
}

function toExecutionLogRow(log: ExecutionLog, userId: string): ExecutionLogRow {
  return {
    id: log.id,
    user_id: userId,
    date: log.date,
    completed_action_ids: log.completedActionIds,
    completed_count: log.completedCount,
    note: log.note,
    created_at: log.createdAt
  };
}

export async function fetchGoalCalendarDataFromSupabase(): Promise<GoalCalendarData | undefined> {
  if (!supabase) {
    return undefined;
  }

  const userId = await getCurrentUserId();

  if (!userId) {
    return undefined;
  }

  const [goalsResult, milestonesResult, actionsResult, logsResult] = await Promise.all([
    supabase.from("goals").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
    supabase.from("milestones").select("*").eq("user_id", userId).order("due_date", { ascending: true }),
    supabase.from("weekly_actions").select("*").eq("user_id", userId).order("week_start_date", { ascending: true }),
    supabase.from("execution_logs").select("*").eq("user_id", userId).order("date", { ascending: true })
  ]);

  if (goalsResult.error || milestonesResult.error || actionsResult.error || logsResult.error) {
    console.error("Unable to load Supabase goal data.", {
      goals: goalsResult.error,
      milestones: milestonesResult.error,
      weeklyActions: actionsResult.error,
      executionLogs: logsResult.error
    });
    return undefined;
  }

  return {
    goals: (goalsResult.data as GoalRow[]).map(toGoal),
    milestones: (milestonesResult.data as MilestoneRow[]).map(toMilestone),
    weeklyActions: (actionsResult.data as WeeklyActionRow[]).map(toWeeklyAction),
    executionLogs: (logsResult.data as ExecutionLogRow[]).map(toExecutionLog)
  };
}

export async function upsertGoalsInSupabase(goals: Goal[]) {
  if (!supabase || goals.length === 0) {
    return;
  }

  const userId = await getCurrentUserId();

  if (!userId) {
    return;
  }

  const { error } = await supabase.from("goals").upsert(goals.map((goal) => toGoalRow(goal, userId)));
  if (error) {
    console.error("Unable to save goals to Supabase.", error);
  }
}

export async function upsertMilestonesInSupabase(milestones: Milestone[]) {
  if (!supabase || milestones.length === 0) {
    return;
  }

  const userId = await getCurrentUserId();

  if (!userId) {
    return;
  }

  const { error } = await supabase.from("milestones").upsert(milestones.map((milestone) => toMilestoneRow(milestone, userId)));
  if (error) {
    console.error("Unable to save milestones to Supabase.", error);
  }
}

export async function upsertWeeklyActionsInSupabase(actions: WeeklyAction[]) {
  if (!supabase || actions.length === 0) {
    return;
  }

  const userId = await getCurrentUserId();

  if (!userId) {
    return;
  }

  const { error } = await supabase.from("weekly_actions").upsert(actions.map((action) => toWeeklyActionRow(action, userId)));
  if (error) {
    console.error("Unable to save weekly actions to Supabase.", error);
  }
}

export async function upsertExecutionLogsInSupabase(logs: ExecutionLog[]) {
  if (!supabase || logs.length === 0) {
    return;
  }

  const userId = await getCurrentUserId();

  if (!userId) {
    return;
  }

  const { error } = await supabase.from("execution_logs").upsert(logs.map((log) => toExecutionLogRow(log, userId)));
  if (error) {
    console.error("Unable to save execution logs to Supabase.", error);
  }
}

export async function deleteGoalFromSupabase(goalId: string) {
  if (!supabase) {
    return;
  }

  const userId = await getCurrentUserId();

  if (!userId) {
    return;
  }

  const actionsResult = await supabase.from("weekly_actions").delete().eq("goal_id", goalId).eq("user_id", userId);
  const milestonesResult = await supabase.from("milestones").delete().eq("goal_id", goalId).eq("user_id", userId);
  const goalResult = await supabase.from("goals").delete().eq("id", goalId).eq("user_id", userId);

  if (actionsResult.error || milestonesResult.error || goalResult.error) {
    console.error("Unable to delete goal from Supabase.", {
      weeklyActions: actionsResult.error,
      milestones: milestonesResult.error,
      goal: goalResult.error
    });
  }
}

export async function deleteMilestoneFromSupabase(milestoneId: string) {
  if (!supabase) {
    return;
  }

  const userId = await getCurrentUserId();

  if (!userId) {
    return;
  }

  const actionsResult = await supabase.from("weekly_actions").delete().eq("milestone_id", milestoneId).eq("user_id", userId);
  const milestoneResult = await supabase.from("milestones").delete().eq("id", milestoneId).eq("user_id", userId);

  if (actionsResult.error || milestoneResult.error) {
    console.error("Unable to delete milestone from Supabase.", {
      weeklyActions: actionsResult.error,
      milestone: milestoneResult.error
    });
  }
}

export async function deleteWeeklyActionFromSupabase(actionId: string) {
  if (!supabase) {
    return;
  }

  const userId = await getCurrentUserId();

  if (!userId) {
    return;
  }

  const { error } = await supabase.from("weekly_actions").delete().eq("id", actionId).eq("user_id", userId);
  if (error) {
    console.error("Unable to delete weekly action from Supabase.", error);
  }
}

export async function replaceSupabaseGoalCalendarData(data: GoalCalendarData) {
  if (!supabase) {
    return;
  }

  const userId = await getCurrentUserId();

  if (!userId) {
    return;
  }

  await supabase.from("execution_logs").delete().eq("user_id", userId).neq("id", "");
  await supabase.from("weekly_actions").delete().eq("user_id", userId).neq("id", "");
  await supabase.from("milestones").delete().eq("user_id", userId).neq("id", "");
  await supabase.from("goals").delete().eq("user_id", userId).neq("id", "");

  await upsertGoalsInSupabase(data.goals);
  await upsertMilestonesInSupabase(data.milestones);
  await upsertWeeklyActionsInSupabase(data.weeklyActions);
  await upsertExecutionLogsInSupabase(data.executionLogs);
}
