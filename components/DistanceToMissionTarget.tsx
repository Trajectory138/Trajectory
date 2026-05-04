import type { Goal, Milestone } from "@/lib/models";
import { getDaysUntilDate } from "@/lib/dateProgress";
import {
  getGoalTrajectory,
  trajectoryLabels,
  type TrajectoryStatus
} from "@/lib/trajectory";

const statusStyles: Record<TrajectoryStatus, string> = {
  ahead: "border-success bg-successSoft text-success",
  "on-track": "border-warning bg-warningSoft text-warning",
  behind: "border-danger bg-dangerSoft text-danger"
};

function todayAtNoon() {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12);
}

export function getDistanceToMissionTarget(goal: Goal, milestones: Milestone[]) {
  const today = todayAtNoon();
  const daysRemaining = getDaysUntilDate(goal.targetDate, today);
  const totalMilestones = milestones.length;
  const completedMilestones = milestones.filter((milestone) => milestone.completed).length;
  const trajectory = getGoalTrajectory(goal, milestones, today);

  return {
    daysRemaining,
    totalMilestones,
    completedMilestones,
    completionPercentage: trajectory.progressPercentage,
    timeElapsedPercentage: trajectory.timeElapsedPercentage,
    missionStatus: trajectory.status,
    trajectory
  };
}

export function DistanceToMissionTarget({
  goal,
  milestones,
  compact = false
}: {
  goal: Goal;
  milestones: Milestone[];
  compact?: boolean;
}) {
  const target = getDistanceToMissionTarget(goal, milestones);

  return (
    <section className={`rounded-lg border border-line bg-paper ${compact ? "p-3" : "p-4"}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-ink/60">Distance to target</p>
          <p className={`${compact ? "text-2xl" : "text-3xl"} mt-1 font-semibold`}>
            {Math.max(target.daysRemaining, 0)}
            <span className="ml-1 text-sm font-medium text-ink/60">days left</span>
          </p>
        </div>
        <span className={`w-fit rounded-md border px-2 py-1 text-sm font-semibold ${statusStyles[target.missionStatus]}`}>
          {trajectoryLabels[target.missionStatus]}
        </span>
      </div>
      <div className="mt-3 rounded-md border border-line bg-white p-3">
        <p className="text-xs font-semibold uppercase text-ink/60">Trajectory Status</p>
        <p className="mt-1 text-sm font-semibold">{target.trajectory.label}</p>
        <p className="mt-1 text-sm text-ink/60">{target.trajectory.message}</p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-md border border-line bg-white p-3">
          <p className="text-xs text-ink/60">Milestones</p>
          <p className="mt-1 text-lg font-semibold">
            {target.completedMilestones}/{target.totalMilestones}
          </p>
        </div>
        <div className="rounded-md border border-line bg-white p-3">
          <p className="text-xs text-ink/60">Completion</p>
          <p className="mt-1 text-lg font-semibold">{target.completionPercentage}%</p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <div>
          <div className="flex justify-between text-xs text-ink/60">
            <span>Progress</span>
            <span>{target.completionPercentage}%</span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-line">
            <div className="h-2 rounded-full bg-leaf" style={{ width: `${target.completionPercentage}%` }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs text-ink/60">
            <span>Time elapsed</span>
            <span>{target.timeElapsedPercentage}%</span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-line">
            <div className="h-2 rounded-full bg-clay" style={{ width: `${target.timeElapsedPercentage}%` }} />
          </div>
        </div>
      </div>
    </section>
  );
}
