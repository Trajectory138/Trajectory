import type { Goal, Milestone, ProgressSummary, WeeklyAction } from "@/lib/models";

export const goals: Goal[] = [
  {
    id: "launch-portfolio",
    title: "Launch portfolio site",
    description: "Publish a focused portfolio that shows recent work, process, and clear contact paths.",
    whyItMatters: "A stronger portfolio makes it easier to share work confidently and start better career conversations.",
    targetDate: "2026-06-15",
    status: "active",
    createdAt: "2026-04-20"
  },
  {
    id: "run-10k",
    title: "Run a comfortable 10K",
    description: "Build endurance steadily with three weekly runs and one recovery session.",
    whyItMatters: "Consistent training supports energy, confidence, and a healthier weekly routine.",
    targetDate: "2026-07-20",
    status: "active",
    createdAt: "2026-04-22"
  }
];

export const milestones: Milestone[] = [
  {
    id: "portfolio-direction",
    goalId: "launch-portfolio",
    title: "Choose visual direction",
    description: "Define the core look and feel for the portfolio before committing to page layouts.",
    dueDate: "2026-05-04",
    completed: true,
    successCriteria: ["Mood and typography direction selected", "Color palette chosen", "Homepage tone feels clear"],
    blockers: ["Too many visual references", "Unclear positioning"],
    nextStep: "Apply the chosen direction to the homepage wireframe.",
    notes: "Set the visual tone before writing or building so every page feels consistent."
  },
  {
    id: "portfolio-case-studies",
    goalId: "launch-portfolio",
    title: "Draft three case studies",
    description: "Write concise case studies that explain the problem, role, process, and outcome.",
    dueDate: "2026-05-18",
    completed: true,
    successCriteria: ["Three drafts completed", "Each case has a clear outcome", "Screenshots are identified"],
    blockers: ["Missing project metrics", "Case studies getting too long"],
    nextStep: "Edit each draft down to the strongest story arc.",
    notes: "Focus each case study on the problem, process, outcome, and one concise takeaway."
  },
  {
    id: "portfolio-build",
    goalId: "launch-portfolio",
    title: "Build homepage and project pages",
    description: "Create the first working version of the portfolio pages with real content.",
    dueDate: "2026-06-01",
    completed: false,
    successCriteria: ["Homepage is responsive", "Three project pages are linked", "Contact path is obvious"],
    blockers: ["Final assets not exported", "Copy still changing"],
    nextStep: "Build the homepage and one reusable project page layout.",
    notes: "Keep the first version simple: homepage, project index, three project pages, and contact."
  },
  {
    id: "portfolio-publish",
    goalId: "launch-portfolio",
    title: "Review, polish, and publish",
    description: "Run final quality checks and publish the portfolio.",
    dueDate: "2026-06-15",
    completed: false,
    successCriteria: ["No broken links", "Mobile layout reviewed", "Portfolio is live"],
    blockers: ["Unresolved feedback", "Domain or hosting setup"],
    nextStep: "Create a final review checklist.",
    notes: "Do one pass for copy, one for layout, and one for mobile before publishing."
  },
  {
    id: "run-three-miles",
    goalId: "run-10k",
    title: "Run 3 miles without stopping",
    description: "Complete a comfortable continuous 3-mile run as the endurance baseline.",
    dueDate: "2026-05-10",
    completed: true,
    successCriteria: ["Run completed without walking", "Pace stays conversational", "Recovery feels normal next day"],
    blockers: ["Overpacing early", "Skipping warmup"],
    nextStep: "Add one short easy run next week.",
    notes: "This is the baseline checkpoint before increasing weekly volume."
  },
  {
    id: "run-weekly-rhythm",
    goalId: "run-10k",
    title: "Hold a 4-run weekly rhythm",
    description: "Establish a repeatable weekly training rhythm before adding more distance.",
    dueDate: "2026-06-03",
    completed: false,
    successCriteria: ["Four runs completed in one week", "At least one recovery day kept", "No pain escalation"],
    blockers: ["Schedule crowding", "Doing every run too hard"],
    nextStep: "Plan the next four runs on the weekly calendar.",
    notes: "Prioritize consistency over pace. Keep most runs easy."
  },
  {
    id: "run-five-miles",
    goalId: "run-10k",
    title: "Finish a 5-mile long run",
    description: "Stretch the long run distance while keeping effort controlled.",
    dueDate: "2026-06-24",
    completed: false,
    successCriteria: ["Five miles completed", "Effort stays steady", "No skipped recovery afterward"],
    blockers: ["Heat or poor route choice", "Increasing distance too quickly"],
    nextStep: "Choose a flat route and schedule the long run.",
    notes: "Use this to confirm endurance is building before the full 10K attempt."
  }
];

export const weeklyActions: WeeklyAction[] = [
  {
    id: "portfolio-edit-copy",
    goalId: "launch-portfolio",
    milestoneId: "portfolio-case-studies",
    title: "Edit case study intro copy",
    description: "Rewrite each intro so it quickly explains the project context and result.",
    weekStartDate: "2026-05-04",
    completed: true,
    estimatedTime: "45 minutes",
    priority: "high",
    energyLevel: "medium",
    notes: "Tighten the opening paragraph so the project value is clear within the first few lines."
  },
  {
    id: "portfolio-export-images",
    goalId: "launch-portfolio",
    milestoneId: "portfolio-build",
    title: "Export final project screenshots",
    description: "Prepare the image assets needed for the project pages.",
    weekStartDate: "2026-05-04",
    completed: false,
    estimatedTime: "60 minutes",
    priority: "medium",
    energyLevel: "low",
    notes: "Capture desktop and mobile states for the portfolio project pages."
  },
  {
    id: "run-easy-thirty",
    goalId: "run-10k",
    milestoneId: "run-weekly-rhythm",
    title: "Easy 30-minute run",
    description: "Complete an easy run that supports consistency without adding fatigue.",
    weekStartDate: "2026-05-04",
    completed: false,
    estimatedTime: "30 minutes",
    priority: "high",
    energyLevel: "medium",
    notes: "Keep the pace conversational and finish feeling like another mile would be possible."
  }
];

export function getGoalById(id: string) {
  return goals.find((goal) => goal.id === id);
}

export function getMilestonesForGoal(goalId: string) {
  return milestones.filter((milestone) => milestone.goalId === goalId);
}

export function getWeeklyActionsForGoal(goalId: string) {
  return weeklyActions.filter((action) => action.goalId === goalId);
}

export function getGoalProgress(goalId: string) {
  const goalMilestones = getMilestonesForGoal(goalId);

  if (goalMilestones.length === 0) {
    return 0;
  }

  const completedMilestones = goalMilestones.filter((milestone) => milestone.completed).length;
  return Math.round((completedMilestones / goalMilestones.length) * 100);
}

export function getWeeklyActions() {
  return weeklyActions.map((action) => ({
    ...action,
    goalTitle: getGoalById(action.goalId)?.title ?? "Unknown goal",
    milestoneTitle: milestones.find((milestone) => milestone.id === action.milestoneId)?.title ?? "Unknown milestone"
  }));
}

export function getProgressSummary(): ProgressSummary {
  const goalProgressValues = goals.map((goal) => getGoalProgress(goal.id));
  const completedMilestones = milestones.filter((milestone) => milestone.completed).length;
  const completedWeeklyActions = weeklyActions.filter((action) => action.completed).length;

  return {
    totalGoals: goals.length,
    activeGoals: goals.filter((goal) => goal.status === "active").length,
    completedMilestones,
    totalMilestones: milestones.length,
    completedWeeklyActions,
    totalWeeklyActions: weeklyActions.length,
    averageProgress: Math.round(
      goalProgressValues.reduce((total, progress) => total + progress, 0) / goalProgressValues.length
    )
  };
}
