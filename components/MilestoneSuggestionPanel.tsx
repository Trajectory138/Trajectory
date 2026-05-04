"use client";

import { useEffect, useState } from "react";

import type { Goal, Milestone } from "@/lib/models";
import {
  createMilestoneFromSuggestion,
  refineMilestoneSuggestions,
  suggestMilestonesForGoal,
  type SuggestedMilestone
} from "@/lib/milestoneSuggestions";

function updateListValue(values: string[], index: number, value: string) {
  return values.map((item, itemIndex) => (itemIndex === index ? value : item));
}

function cleanSuggestion(suggestion: SuggestedMilestone): SuggestedMilestone {
  return {
    ...suggestion,
    title: suggestion.title.trim(),
    description: suggestion.description.trim(),
    nextStep: suggestion.nextStep.trim(),
    successCriteria: suggestion.successCriteria.map((item) => item.trim()).filter(Boolean),
    blockers: suggestion.blockers.map((item) => item.trim()).filter(Boolean),
    notes: suggestion.notes?.trim() || undefined
  };
}

export function MilestoneSuggestionPanel({
  goal,
  onAcceptMilestones,
  generateSignal = 0
}: {
  goal: Goal;
  onAcceptMilestones: (milestones: Milestone[]) => void;
  generateSignal?: number;
}) {
  const [suggestions, setSuggestions] = useState<SuggestedMilestone[]>([]);
  const [acceptedIndexes, setAcceptedIndexes] = useState<Set<number>>(new Set());

  const visibleSuggestions = suggestions.filter((_, index) => !acceptedIndexes.has(index));

  function generateSuggestions() {
    setSuggestions(suggestMilestonesForGoal(goal));
    setAcceptedIndexes(new Set());
  }

  useEffect(() => {
    if (generateSignal > 0) {
      generateSuggestions();
    }
  }, [generateSignal]);

  function refineSuggestions() {
    setSuggestions((current) => refineMilestoneSuggestions(goal, current.length > 0 ? current : suggestMilestonesForGoal(goal)));
    setAcceptedIndexes(new Set());
  }

  function updateSuggestion(index: number, changes: Partial<SuggestedMilestone>) {
    setSuggestions((current) =>
      current.map((suggestion, suggestionIndex) =>
        suggestionIndex === index ? { ...suggestion, ...changes } : suggestion
      )
    );
  }

  function acceptSuggestions(indexes: number[]) {
    const validSuggestions = indexes
      .map((index) => ({ index, suggestion: cleanSuggestion(suggestions[index]) }))
      .filter(({ suggestion }) => suggestion.title && suggestion.dueDate);
    const milestones = validSuggestions.map(({ suggestion }, itemIndex) =>
      createMilestoneFromSuggestion(suggestion, goal.id, itemIndex)
    );

    if (milestones.length === 0) {
      return;
    }

    onAcceptMilestones(milestones);
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
    <section id="milestone-suggestions" className="rounded-lg border border-line bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">Milestone Suggestions</h2>
          <p className="mt-1 text-sm leading-6 text-ink/60">
            Generate draft milestones from this goal, then edit and accept the ones that fit.
          </p>
        </div>
        <button
          type="button"
          onClick={generateSuggestions}
          className="inline-flex items-center justify-center rounded-md bg-leaf px-3 py-2 text-sm font-semibold text-white transition hover:bg-ink"
        >
          Suggest milestones
        </button>
      </div>

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
                        <span className="text-sm font-medium">Title</span>
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
                          <span className="text-sm font-medium">Due date</span>
                          <input
                            type="date"
                            value={suggestion.dueDate}
                            onChange={(event) => updateSuggestion(index, { dueDate: event.target.value })}
                            className="mt-2 w-full rounded-md border border-line bg-white px-3 py-2 text-sm outline-leaf"
                          />
                        </label>
                        <label className="block">
                          <span className="text-sm font-medium">Next step</span>
                          <input
                            value={suggestion.nextStep}
                            onChange={(event) => updateSuggestion(index, { nextStep: event.target.value })}
                            className="mt-2 w-full rounded-md border border-line bg-white px-3 py-2 text-sm outline-leaf"
                          />
                        </label>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <p className="text-sm font-medium">Success criteria</p>
                          <div className="mt-2 space-y-2">
                            {suggestion.successCriteria.map((item, itemIndex) => (
                              <input
                                key={itemIndex}
                                value={item}
                                onChange={(event) =>
                                  updateSuggestion(index, {
                                    successCriteria: updateListValue(
                                      suggestion.successCriteria,
                                      itemIndex,
                                      event.target.value
                                    )
                                  })
                                }
                                className="w-full rounded-md border border-line bg-white px-3 py-2 text-sm outline-leaf"
                              />
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="text-sm font-medium">Possible blockers</p>
                          <div className="mt-2 space-y-2">
                            {suggestion.blockers.map((item, itemIndex) => (
                              <input
                                key={itemIndex}
                                value={item}
                                onChange={(event) =>
                                  updateSuggestion(index, {
                                    blockers: updateListValue(suggestion.blockers, itemIndex, event.target.value)
                                  })
                                }
                                className="w-full rounded-md border border-line bg-white px-3 py-2 text-sm outline-leaf"
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 border-t border-line pt-4 sm:flex-row sm:items-center">
                        <button
                          type="button"
                          onClick={() => acceptSuggestions([index])}
                          className="rounded-md bg-leaf px-3 py-2 text-sm font-semibold text-white transition hover:bg-ink"
                        >
                          Accept milestone
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
