import type { Goal, Milestone, WeeklyAction } from "@/lib/models";
import { parseGoalDate } from "@/lib/dateProgress";

export type SuggestedWeeklyAction = Omit<WeeklyAction, "id" | "goalId" | "completed">;

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getCurrentWeekStartDate() {
  const today = new Date();
  const day = today.getDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;
  const monday = new Date(today);
  monday.setDate(today.getDate() - daysSinceMonday);

  return toDateInputValue(monday);
}

function describeAction(milestone: Milestone, goal: Goal) {
  const title = milestone.nextStep || `Move ${milestone.title} forward`;
  const goalContext = goal.title.toLowerCase();

  if (goalContext.includes("portfolio") || milestone.title.toLowerCase().includes("case stud")) {
    return title.toLowerCase().includes("copy") || title.toLowerCase().includes("draft")
      ? title
      : `Draft the next concrete piece for ${milestone.title.toLowerCase()}`;
  }

  return title;
}

function getChunkTitle(milestone: Milestone, goal: Goal, index: number) {
  const baseAction = describeAction(milestone, goal);
  const lowerTitle = baseAction.toLowerCase();

  if (lowerTitle.includes("review") || lowerTitle.includes("test")) {
    return baseAction;
  }

  if (index === 0) {
    return baseAction;
  }

  if (index === 1) {
    return `Draft progress on ${milestone.title.toLowerCase()}`;
  }

  return `Review and unblock ${milestone.title.toLowerCase()}`;
}

function getUrgencyPriority(milestone: Milestone, index: number): WeeklyAction["priority"] {
  const due = parseGoalDate(milestone.dueDate);

  if (!due) {
    return index === 0 ? "high" : "medium";
  }

  const daysUntilDue = Math.ceil((due.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntilDue <= 10 || index === 0) {
    return "high";
  }

  return daysUntilDue <= 21 ? "medium" : "low";
}

export function suggestWeeklyActionsForGoal(goal: Goal, milestones: Milestone[]): SuggestedWeeklyAction[] {
  const target = parseGoalDate(goal.targetDate);
  const weekStartDate = getCurrentWeekStartDate();
  const sortedMilestones = [...milestones]
    .filter((milestone) => !milestone.completed)
    .sort((a, b) => {
      const aDue = parseGoalDate(a.dueDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const bDue = parseGoalDate(b.dueDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      return aDue - bDue;
    });
  const fallbackMilestones = sortedMilestones.length > 0 ? sortedMilestones : milestones.slice(0, 3);

  return fallbackMilestones.slice(0, 3).map((milestone, index) => {
    const dueDate = parseGoalDate(milestone.dueDate);
    const targetNote = target ? ` Goal target: ${toDateInputValue(target)}.` : "";
    const dueNote = dueDate ? ` Milestone due: ${toDateInputValue(dueDate)}.` : "";

    return {
      milestoneId: milestone.id,
      title: getChunkTitle(milestone, goal, index),
      description: `A realistic weekly chunk to advance "${milestone.title}" without trying to finish the whole milestone at once.${dueNote}${targetNote}`,
      weekStartDate,
      estimatedTime: index === 0 ? "45 minutes" : "30 minutes",
      priority: getUrgencyPriority(milestone, index),
      energyLevel: index === 0 ? "medium" : "low",
      notes: `Suggested from milestone: ${milestone.title}`
    };
  });
}

export function refineWeeklyActionSuggestions(
  goal: Goal,
  milestones: Milestone[],
  suggestions: SuggestedWeeklyAction[]
): SuggestedWeeklyAction[] {
  const milestonesById = new Map(milestones.map((milestone) => [milestone.id, milestone]));
  const baseSuggestions = suggestions.length > 0 ? suggestions : suggestWeeklyActionsForGoal(goal, milestones);

  return baseSuggestions.map((suggestion, index) => {
    const milestone = milestonesById.get(suggestion.milestoneId);
    const milestoneTitle = milestone?.title ?? "the connected milestone";
    const dueDate = milestone?.dueDate ? ` Due ${milestone.dueDate}.` : "";

    return {
      ...suggestion,
      title: suggestion.title.startsWith("This week:")
        ? suggestion.title
        : `This week: ${suggestion.title}`,
      description: `${suggestion.description} Keep the scope small enough to complete in one work session.${dueDate}`,
      estimatedTime: suggestion.estimatedTime || "30 minutes",
      priority: milestone ? getUrgencyPriority(milestone, index) : suggestion.priority,
      energyLevel: index === 0 ? "medium" : suggestion.energyLevel,
      notes: `Refined weekly chunk for ${milestoneTitle} under "${goal.title}".`
    };
  });
}

export function createWeeklyActionFromSuggestion(
  suggestion: SuggestedWeeklyAction,
  goalId: string,
  index: number
): WeeklyAction {
  const slug = suggestion.title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);

  return {
    id: `${goalId}-${slug || "action"}-${Date.now()}-${index}`,
    goalId,
    completed: false,
    ...suggestion
  };
}
