import type { Goal, Milestone } from "@/lib/models";
import { getDateProgressPercentage } from "@/lib/dateProgress";

export type TrajectoryStatus = "ahead" | "on-track" | "behind";

export const trajectoryLabels: Record<TrajectoryStatus, string> = {
  ahead: "Ahead",
  "on-track": "On track",
  behind: "Behind"
};

export const trajectoryMessages: Record<TrajectoryStatus, string> = {
  ahead: "You are exceeding plan",
  "on-track": "You are aligned with plan",
  behind: "You are falling behind schedule"
};

export function getGoalCompletionPercentage(milestones: Milestone[]) {
  if (milestones.length === 0) {
    return 0;
  }

  return Math.round((milestones.filter((milestone) => milestone.completed).length / milestones.length) * 100);
}

export function getTrajectoryStatus(progressPercentage: number, timeElapsedPercentage: number): TrajectoryStatus {
  const delta = progressPercentage - timeElapsedPercentage;

  if (delta > 10) {
    return "ahead";
  }

  if (delta < -10) {
    return "behind";
  }

  return "on-track";
}

export function getGoalTrajectory(goal: Goal, milestones: Milestone[], currentDate?: Date) {
  const progressPercentage = getGoalCompletionPercentage(milestones);
  const timeElapsedPercentage = getDateProgressPercentage({
    startDate: goal.createdAt,
    endDate: goal.targetDate,
    currentDate
  });
  const status = getTrajectoryStatus(progressPercentage, timeElapsedPercentage);

  return {
    progressPercentage,
    timeElapsedPercentage,
    status,
    label: trajectoryLabels[status],
    message: trajectoryMessages[status]
  };
}
