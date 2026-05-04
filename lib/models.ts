export type GoalStatus = "not_started" | "active" | "paused" | "completed";

export type Goal = {
  id: string;
  title: string;
  description: string;
  whyItMatters: string;
  targetDate: string;
  status: GoalStatus;
  createdAt: string;
};

export type Milestone = {
  id: string;
  goalId: string;
  title: string;
  description: string;
  dueDate: string;
  completed: boolean;
  successCriteria: string[];
  blockers: string[];
  nextStep: string;
  notes?: string;
};

export type WeeklyActionPriority = "low" | "medium" | "high";
export type WeeklyActionEnergyLevel = "low" | "medium" | "high";

export type WeeklyAction = {
  id: string;
  goalId: string;
  milestoneId: string;
  title: string;
  description: string;
  weekStartDate: string;
  completed: boolean;
  estimatedTime: string;
  priority: WeeklyActionPriority;
  energyLevel: WeeklyActionEnergyLevel;
  notes?: string;
  activeWeek?: boolean;
  weekLocked?: boolean;
};

export type ProgressSummary = {
  totalGoals: number;
  activeGoals: number;
  completedMilestones: number;
  totalMilestones: number;
  completedWeeklyActions: number;
  totalWeeklyActions: number;
  averageProgress: number;
};

export type ExecutionLog = {
  id: string;
  date: string;
  completedActionIds: string[];
  completedCount: number;
  note: string;
  createdAt: string;
};
