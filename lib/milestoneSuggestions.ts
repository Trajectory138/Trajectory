import type { Goal, Milestone } from "@/lib/models";
import { parseGoalDate } from "@/lib/dateProgress";

export type SuggestedMilestone = Omit<Milestone, "id" | "goalId" | "completed">;

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(date.getDate() + days);
  return nextDate;
}

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getSuggestedDueDate(targetDate: string, index: number, total: number) {
  const today = new Date();
  const target = parseGoalDate(targetDate) ?? addDays(today, total * 14);
  const daysUntilTarget = Math.max(7, Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
  const isFinalMilestone = index === total - 1;
  const spacingRatio = isFinalMilestone ? 0.96 : (index + 1) / total;
  const offset = Math.max(3, Math.min(daysUntilTarget, Math.round(daysUntilTarget * spacingRatio)));

  return toDateInputValue(addDays(today, offset));
}

function getGoalNoun(goal: Goal) {
  return goal.title.trim().toLowerCase() || "goal";
}

export function suggestMilestonesForGoal(goal: Goal): SuggestedMilestone[] {
  const context = `${goal.title} ${goal.description} ${goal.whyItMatters}`.toLowerCase();
  const isPortfolio = context.includes("portfolio") || context.includes("case stud");
  const isFitness = context.includes("fitness") || context.includes("run") || context.includes("health");
  const total = isPortfolio || isFitness ? 5 : 4;

  const suggestions = isPortfolio
    ? [
        {
          title: "Define the portfolio story",
          description: "Clarify the target audience, project themes, and the strongest proof points to feature.",
          successCriteria: ["Audience is defined", "Project list is narrowed", "Core message is written"],
          blockers: ["Unclear positioning", "Too many possible projects"],
          nextStep: "Choose the three projects that best support the portfolio goal."
        },
        {
          title: "Draft three case studies",
          description: "Create rough case study drafts that explain the problem, process, outcome, and role.",
          successCriteria: ["Three drafts exist", "Each draft includes outcomes", "Missing assets are listed"],
          blockers: ["Incomplete project metrics", "Missing screenshots"],
          nextStep: "Outline the first case study from problem to result."
        },
        {
          title: "Build the portfolio structure",
          description: "Create the main page structure, navigation, project sections, and contact path.",
          successCriteria: ["Homepage structure is complete", "Project routes are in place", "Contact path works"],
          blockers: ["Unsettled layout", "Missing copy"],
          nextStep: "Sketch the page sections and decide what appears above the fold."
        },
        {
          title: "Polish copy and visuals",
          description: "Refine headlines, supporting copy, screenshots, and visual rhythm across the portfolio.",
          successCriteria: ["Copy is edited", "Images are optimized", "Mobile layout is reviewed"],
          blockers: ["Low-quality images", "Overlong descriptions"],
          nextStep: "Edit the first case study intro copy."
        },
        {
          title: "Launch and review",
          description: "Publish the portfolio, test key paths, and collect feedback from trusted reviewers.",
          successCriteria: ["Site is live", "Links are tested", "Feedback list is captured"],
          blockers: ["Deployment issues", "Last-minute scope creep"],
          nextStep: "Run a launch checklist on desktop and mobile."
        }
      ]
    : isFitness
      ? [
          {
            title: "Set the baseline",
            description: "Record the current starting point and define what progress will look like.",
            successCriteria: ["Baseline is recorded", "Target metrics are clear", "Schedule is realistic"],
            blockers: ["Unclear tracking method", "Overambitious target"],
            nextStep: "Log the current baseline and choose the main metric."
          },
          {
            title: "Create the weekly routine",
            description: "Map a repeatable weekly plan that fits available time and energy.",
            successCriteria: ["Weekly schedule is written", "Recovery time is included", "First week is planned"],
            blockers: ["Calendar conflicts", "Too many intense sessions"],
            nextStep: "Block the first three sessions on the calendar."
          },
          {
            title: "Complete the first consistency check",
            description: "Review the first stretch of work and adjust the plan based on what happened.",
            successCriteria: ["Progress is reviewed", "Routine is adjusted", "Next week is selected"],
            blockers: ["Missed sessions", "Unclear feedback"],
            nextStep: "Review what made the easiest session work."
          },
          {
            title: "Increase challenge carefully",
            description: "Add a measured increase while keeping the plan sustainable.",
            successCriteria: ["Challenge increase is defined", "Recovery remains planned", "Progress stays steady"],
            blockers: ["Doing too much too soon", "Insufficient rest"],
            nextStep: "Choose one variable to increase next week."
          },
          {
            title: "Complete final review",
            description: "Compare results against the target and decide what to maintain next.",
            successCriteria: ["Final metric is recorded", "Lessons are captured", "Next goal is identified"],
            blockers: ["Inconsistent data", "No maintenance plan"],
            nextStep: "Write the final review notes."
          }
        ]
      : [
          {
            title: "Clarify the outcome",
            description: "Turn the goal into a concrete target with clear scope and success signals.",
            successCriteria: ["Outcome is specific", "Success signals are listed", "Scope is realistic"],
            blockers: ["Unclear finish line", "Competing priorities"],
            nextStep: "Write a one-sentence definition of done."
          },
          {
            title: "Map the workstreams",
            description: "Break the goal into the major areas of work that need attention before the target date.",
            successCriteria: ["Workstreams are listed", "Dependencies are identified", "First actions are clear"],
            blockers: ["Hidden dependencies", "Too many parallel efforts"],
            nextStep: "List the three most important workstreams."
          },
          {
            title: "Complete the first working version",
            description: "Produce an early version that makes progress visible and easier to evaluate.",
            successCriteria: ["First version exists", "Gaps are visible", "Feedback questions are written"],
            blockers: ["Perfectionism", "Missing inputs"],
            nextStep: "Create the smallest useful version."
          },
          {
            title: "Review and refine",
            description: "Use feedback and evidence to tighten the work before the final push.",
            successCriteria: ["Feedback is collected", "Top revisions are chosen", "Low-value work is cut"],
            blockers: ["Conflicting feedback", "Scope expansion"],
            nextStep: "Pick the three highest-impact improvements."
          }
        ];

  return suggestions.slice(0, total).map((suggestion, index) => ({
    ...suggestion,
    dueDate: getSuggestedDueDate(goal.targetDate, index, total),
    notes: `Suggested milestone ${index + 1} of ${total}, sequenced toward ${goal.targetDate}. Edit before accepting if needed.`
  }));
}

export function refineMilestoneSuggestions(goal: Goal, suggestions: SuggestedMilestone[]): SuggestedMilestone[] {
  const goalNoun = getGoalNoun(goal);
  const orderedSuggestions = suggestions.map((suggestion, index) => {
    const phaseLabel = index === 0
      ? "Foundation"
      : index === suggestions.length - 1
        ? "Launch and review"
        : `Phase ${index + 1}`;

    return {
      ...suggestion,
      title: suggestion.title.includes(":") ? suggestion.title : `${phaseLabel}: ${suggestion.title}`,
      description: `${suggestion.description} This keeps "${goalNoun}" moving toward the target date with a clear checkpoint.`,
      successCriteria: suggestion.successCriteria.length > 0
        ? suggestion.successCriteria
        : ["Checkpoint is complete", "Next work is clear", "Risks are visible"],
      blockers: suggestion.blockers.length > 0 ? suggestion.blockers : ["Unclear scope", "Competing priorities"],
      nextStep: suggestion.nextStep || `Choose the next concrete step for ${suggestion.title.toLowerCase()}.`,
      dueDate: getSuggestedDueDate(goal.targetDate, index, suggestions.length),
      notes: `Refined suggestion ${index + 1} of ${suggestions.length}, ordered from foundation to finish.`
    };
  });

  return orderedSuggestions.sort((a, b) => {
    const aDue = parseGoalDate(a.dueDate)?.getTime() ?? 0;
    const bDue = parseGoalDate(b.dueDate)?.getTime() ?? 0;
    return aDue - bDue;
  });
}

export function createMilestoneFromSuggestion(
  suggestion: SuggestedMilestone,
  goalId: string,
  index: number
): Milestone {
  const slug = suggestion.title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);

  return {
    id: `${goalId}-${slug || "milestone"}-${Date.now()}-${index}`,
    goalId,
    completed: false,
    ...suggestion
  };
}
