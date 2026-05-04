"use client";

import { useEffect, useState } from "react";

import type { Goal, Milestone, WeeklyAction, WeeklyActionEnergyLevel, WeeklyActionPriority } from "@/lib/models";
import {
  createWeeklyActionFromSuggestion,
  refineWeeklyActionSuggestions,
  suggestWeeklyActionsForGoal,
  type SuggestedWeeklyAction
} from "@/lib/weeklyActionSuggestions";

const priorityOptions: WeeklyActionPriority[] = ["high", "medium", "low"];
const energyOptions: WeeklyActionEnergyLevel[] = ["high", "medium", "low"];

function cleanSuggestion(suggestion: SuggestedWeeklyAction): SuggestedWeeklyAction {
  return {
    ...suggestion,
    title: suggestion.title.trim(),
    description: suggestion.description.trim(),
    estimatedTime: suggestion.estimatedTime.trim(),
    notes: suggestion.notes?.trim() || undefined
  };
}

export function WeeklyActionSuggestionPanel({
  goal,
  milestones,
  onAcceptActions,
  generateSignal = 0
}: {
  goal: Goal;
  milestones: Milestone[];
  onAcceptActions: (actions: WeeklyAction[]) => void;
  generateSignal?: number;
}) {
  const [suggestions, setSuggestions] = useState<SuggestedWeeklyAction[]>([]);
  const [acceptedIndexes, setAcceptedIndexes] = useState<Set<number>>(new Set());
  const hasMilestones = milestones.length > 0;
  const availableMilestones = milestones.filter((milestone) => !milestone.completed);
  const sourceMilestones = availableMilestones.length > 0 ? availableMilestones : milestones;
  const visibleSuggestions = suggestions.filter((_, index) => !acceptedIndexes.has(index));

  function generateSuggestions() {
    setSuggestions(suggestWeeklyActionsForGoal(goal, milestones));
    setAcceptedIndexes(new Set());
  }

  useEffect(() => {
    if (generateSignal > 0 && hasMilestones) {
      generateSuggestions();
    }
  }, [generateSignal, hasMilestones]);

  function refineSuggestions() {
    setSuggestions((current) =>
      refineWeeklyActionSuggestions(goal, milestones, current.length > 0 ? current : suggestWeeklyActionsForGoal(goal, milestones))
    );
    setAcceptedIndexes(new Set());
  }

  function updateSuggestion(index: number, changes: Partial<SuggestedWeeklyAction>) {
    setSuggestions((current) =>
      current.map((suggestion, suggestionIndex) =>
        suggestionIndex === index ? { ...suggestion, ...changes } : suggestion
      )
    );
  }

  function acceptSuggestions(indexes: number[]) {
    const validSuggestions = indexes
      .map((index) => ({ index, suggestion: cleanSuggestion(suggestions[index]) }))
      .filter(({ suggestion }) => suggestion.title && suggestion.weekStartDate);
    const actions = validSuggestions.map(({ suggestion }, itemIndex) =>
      createWeeklyActionFromSuggestion(suggestion, goal.id, itemIndex)
    );

    if (actions.length === 0) {
      return;
    }

    onAcceptActions(actions);
    setAcceptedIndexes((current) => {
      const nextAccepted = new Set(current);
      validSuggestions.forEach(({ index }) => nextAccepted.add(index));
      return nextAccepted;
    });
  }

  function discardSuggestions() {
    setSuggestions([]);
    setAcceptedIndexes(new Set());
  }

  return (
    <section id="weekly-action-suggestions" className="rounded-lg border border-line bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">Weekly Action Suggestions</h2>
          <p className="mt-1 text-sm leading-6 text-ink/60">
            Turn incomplete milestones into one to three focused actions for this week.
          </p>
        </div>
        <button
          type="button"
          onClick={generateSuggestions}
          disabled={!hasMilestones}
          aria-describedby={!hasMilestones ? "weekly-action-suggestion-disabled" : undefined}
          className="inline-flex items-center justify-center rounded-md bg-leaf px-3 py-2 text-sm font-semibold text-white transition hover:bg-ink disabled:cursor-not-allowed disabled:bg-line disabled:text-ink/50"
        >
          Suggest weekly actions
        </button>
      </div>

      {!hasMilestones ? (
        <p id="weekly-action-suggestion-disabled" className="mt-4 rounded-lg border border-line bg-paper p-4 text-sm text-ink/60">
          Add or accept milestones before generating weekly action suggestions.
        </p>
      ) : null}

      {suggestions.length > 0 ? (
        <div className="mt-5 space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={generateSuggestions}
              className="rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-ink/70 transition hover:border-leaf hover:text-leaf"
            >
              Regenerate suggestions
            </button>
            <button
              type="button"
              onClick={refineSuggestions}
              className="rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-ink/70 transition hover:border-leaf hover:text-leaf"
            >
              Refine suggestions
            </button>
            <button
              type="button"
              onClick={() => acceptSuggestions(suggestions.map((_, index) => index).filter((index) => !acceptedIndexes.has(index)))}
              disabled={visibleSuggestions.length === 0}
              className="rounded-md bg-ink px-3 py-2 text-sm font-semibold text-white transition hover:bg-leaf disabled:cursor-not-allowed disabled:bg-line disabled:text-ink/50"
            >
              Accept all
            </button>
            <button
              type="button"
              onClick={discardSuggestions}
              className="rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-ink/70 transition hover:border-clay hover:text-clay"
            >
              Discard suggestions
            </button>
          </div>

          {visibleSuggestions.length === 0 ? (
            <p className="rounded-lg border border-line bg-paper p-4 text-sm text-ink/60">
              All suggestions have been accepted.
            </p>
          ) : (
            <ul className="space-y-3">
              {suggestions.map((suggestion, index) =>
                acceptedIndexes.has(index) ? null : (
                  <li key={`${suggestion.title}-${index}`} className="rounded-lg border border-line bg-paper p-4">
                    <div className="grid gap-4">
                      <label className="block">
                        <span className="text-sm font-medium">Action title</span>
                        <input
                          value={suggestion.title}
                          onChange={(event) => updateSuggestion(index, { title: event.target.value })}
                          className="mt-2 w-full rounded-md border border-line bg-white px-3 py-2 text-sm outline-leaf"
                        />
                      </label>

                      <label className="block">
                        <span className="text-sm font-medium">Description</span>
                        <textarea
                          value={suggestion.description}
                          onChange={(event) => updateSuggestion(index, { description: event.target.value })}
                          rows={3}
                          className="mt-2 w-full rounded-md border border-line bg-white px-3 py-2 text-sm outline-leaf"
                        />
                      </label>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block">
                          <span className="text-sm font-medium">Milestone</span>
                          <select
                            value={suggestion.milestoneId}
                            onChange={(event) => updateSuggestion(index, { milestoneId: event.target.value })}
                            className="mt-2 w-full rounded-md border border-line bg-white px-3 py-2 text-sm outline-leaf"
                          >
                            {sourceMilestones.map((milestone) => (
                              <option key={milestone.id} value={milestone.id}>
                                {milestone.title}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="block">
                          <span className="text-sm font-medium">Week start</span>
                          <input
                            type="date"
                            value={suggestion.weekStartDate}
                            onChange={(event) => updateSuggestion(index, { weekStartDate: event.target.value })}
                            className="mt-2 w-full rounded-md border border-line bg-white px-3 py-2 text-sm outline-leaf"
                          />
                        </label>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-3">
                        <label className="block">
                          <span className="text-sm font-medium">Estimated time</span>
                          <input
                            value={suggestion.estimatedTime}
                            onChange={(event) => updateSuggestion(index, { estimatedTime: event.target.value })}
                            className="mt-2 w-full rounded-md border border-line bg-white px-3 py-2 text-sm outline-leaf"
                          />
                        </label>
                        <label className="block">
                          <span className="text-sm font-medium">Priority</span>
                          <select
                            value={suggestion.priority}
                            onChange={(event) =>
                              updateSuggestion(index, { priority: event.target.value as WeeklyActionPriority })
                            }
                            className="mt-2 w-full rounded-md border border-line bg-white px-3 py-2 text-sm outline-leaf"
                          >
                            {priorityOptions.map((priority) => (
                              <option key={priority} value={priority}>
                                {priority}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="block">
                          <span className="text-sm font-medium">Energy</span>
                          <select
                            value={suggestion.energyLevel}
                            onChange={(event) =>
                              updateSuggestion(index, { energyLevel: event.target.value as WeeklyActionEnergyLevel })
                            }
                            className="mt-2 w-full rounded-md border border-line bg-white px-3 py-2 text-sm outline-leaf"
                          >
                            {energyOptions.map((energy) => (
                              <option key={energy} value={energy}>
                                {energy}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>

                      <div className="flex flex-col gap-2 border-t border-line pt-4 sm:flex-row sm:items-center">
                        <button
                          type="button"
                          onClick={() => acceptSuggestions([index])}
                          className="rounded-md bg-leaf px-3 py-2 text-sm font-semibold text-white transition hover:bg-ink"
                        >
                          Accept action
                        </button>
                      </div>
                    </div>
                  </li>
                )
              )}
            </ul>
          )}
        </div>
      ) : null}
    </section>
  );
}
