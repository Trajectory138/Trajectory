"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { goals as demoGoals, milestones as demoMilestones, weeklyActions as demoWeeklyActions } from "@/lib/goals";
import {
  appendExecutionLogNote,
  getExecutionLogForDate,
  getTodayDateKey,
  normalizeExecutionLogs,
  upsertExecutionLogForCompletedAction
} from "@/lib/executionTracking";
import {
  goalCalendarResetEvent,
  goalCalendarStorageKey,
  type GoalCalendarData
} from "@/lib/storage";
import {
  deleteGoalFromSupabase,
  deleteMilestoneFromSupabase,
  deleteWeeklyActionFromSupabase,
  fetchGoalCalendarDataFromSupabase,
  replaceSupabaseGoalCalendarData,
  upsertExecutionLogsInSupabase,
  upsertGoalsInSupabase,
  upsertMilestonesInSupabase,
  upsertWeeklyActionsInSupabase
} from "@/lib/supabaseGoalCalendar";
import type { Goal, Milestone, WeeklyAction } from "@/lib/models";

function getDemoData(): GoalCalendarData {
  return {
    goals: demoGoals,
    milestones: demoMilestones,
    weeklyActions: demoWeeklyActions,
    executionLogs: []
  };
}

function normalizeGoals(goals: Goal[]): Goal[] {
  return goals.map((goal) => ({
    ...goal,
    createdAt: goal.createdAt ?? new Date().toISOString(),
    description: goal.description ?? "",
    whyItMatters: goal.whyItMatters ?? ""
  }));
}

function normalizeMilestones(milestones: Milestone[]): Milestone[] {
  return milestones.map((milestone) => {
    const demoMilestone = demoMilestones.find((item) => item.id === milestone.id);

    return {
      ...milestone,
      description: milestone.description ?? demoMilestone?.description ?? "No description has been added yet.",
      successCriteria: milestone.successCriteria ?? demoMilestone?.successCriteria ?? [],
      blockers: milestone.blockers ?? demoMilestone?.blockers ?? [],
      nextStep: milestone.nextStep ?? demoMilestone?.nextStep ?? "Choose the next concrete step."
    };
  });
}

function normalizeWeeklyActions(actions: WeeklyAction[]): WeeklyAction[] {
  return actions.map((action) => {
    const demoAction = demoWeeklyActions.find((item) => item.id === action.id);

    return {
      ...action,
      description: action.description ?? demoAction?.description ?? "No description has been added yet.",
      estimatedTime: action.estimatedTime ?? demoAction?.estimatedTime ?? "30 minutes",
      priority: action.priority ?? demoAction?.priority ?? "medium",
      energyLevel: action.energyLevel ?? demoAction?.energyLevel ?? "medium",
      activeWeek: action.activeWeek ?? demoAction?.activeWeek ?? false,
      weekLocked: action.weekLocked ?? demoAction?.weekLocked ?? false
    };
  });
}

function readStoredData(): GoalCalendarData {
  if (typeof window === "undefined") {
    return getDemoData();
  }

  const saved = window.localStorage.getItem(goalCalendarStorageKey);

  if (!saved) {
    return getDemoData();
  }

  try {
    const parsed = JSON.parse(saved) as Partial<GoalCalendarData>;
    const hasStoredDemoData = Boolean(
      parsed.goals?.length || parsed.milestones?.length || parsed.weeklyActions?.length
    );

    if (!hasStoredDemoData) {
      return getDemoData();
    }

    return {
      goals: normalizeGoals(parsed.goals ?? demoGoals),
      milestones: normalizeMilestones(parsed.milestones ?? demoMilestones),
      weeklyActions: normalizeWeeklyActions(parsed.weeklyActions ?? demoWeeklyActions),
      executionLogs: normalizeExecutionLogs(parsed.executionLogs ?? [])
    };
  } catch {
    return getDemoData();
  }
}

function saveStoredData(data: GoalCalendarData) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(goalCalendarStorageKey, JSON.stringify(data));
}

export function useGoalCalendarData() {
  const [data, setData] = useState<GoalCalendarData>(getDemoData);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      const remoteData = await fetchGoalCalendarDataFromSupabase();
      const hasRemoteData = Boolean(
        remoteData?.goals.length || remoteData?.milestones.length || remoteData?.weeklyActions.length
      );
      const nextData: GoalCalendarData = hasRemoteData && remoteData ? remoteData : readStoredData();

      if (!isMounted) {
        return;
      }

      setData({
        goals: normalizeGoals(nextData.goals),
        milestones: normalizeMilestones(nextData.milestones),
        weeklyActions: normalizeWeeklyActions(nextData.weeklyActions),
        executionLogs: normalizeExecutionLogs(nextData.executionLogs)
      });
      setLoaded(true);
    }

    void loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!loaded) {
      return;
    }

    window.localStorage.setItem(goalCalendarStorageKey, JSON.stringify(data));
  }, [data, loaded]);

  useEffect(() => {
    function handleReset() {
      setData(getDemoData());
    }

    window.addEventListener(goalCalendarResetEvent, handleReset);
    return () => window.removeEventListener(goalCalendarResetEvent, handleReset);
  }, []);

  const resetDemoData = useCallback(() => {
    const demoData = getDemoData();
    setData(demoData);
    window.localStorage.setItem(goalCalendarStorageKey, JSON.stringify(demoData));
    void replaceSupabaseGoalCalendarData(demoData);
    window.dispatchEvent(new Event(goalCalendarResetEvent));
  }, []);

  const setMilestoneCompleted = useCallback((milestoneId: string, completed: boolean) => {
    setData((current) => {
      const nextData = {
        ...current,
        milestones: current.milestones.map((milestone) =>
          milestone.id === milestoneId ? { ...milestone, completed } : milestone
        )
      };

      saveStoredData(nextData);
      void upsertMilestonesInSupabase(nextData.milestones.filter((milestone) => milestone.id === milestoneId));
      return nextData;
    });
  }, []);

  const setWeeklyActionCompleted = useCallback((actionId: string, completed: boolean, note?: string) => {
    setData((current) => {
      let executionLogs = current.executionLogs;

      if (completed) {
        const todayDate = getTodayDateKey();
        const todayLog = getExecutionLogForDate(normalizeExecutionLogs(executionLogs), todayDate);
        const actionAlreadyCountedToday = todayLog?.completedActionIds.includes(actionId) ?? false;

        executionLogs = upsertExecutionLogForCompletedAction({
          logs: executionLogs,
          actionId,
          dateKey: todayDate
        });

        if (!actionAlreadyCountedToday) {
          executionLogs = appendExecutionLogNote({
            logs: executionLogs,
            note: note ?? "",
            dateKey: todayDate
          });
        }
      }

      const nextData = {
        ...current,
        weeklyActions: current.weeklyActions.map((action) =>
          action.id === actionId ? { ...action, completed } : action
        ),
        executionLogs
      };

      saveStoredData(nextData);
      void upsertWeeklyActionsInSupabase(nextData.weeklyActions.filter((action) => action.id === actionId));
      void upsertExecutionLogsInSupabase(nextData.executionLogs);
      return nextData;
    });
  }, []);

  const addGoal = useCallback((goal: Goal) => {
    setData((current) => {
      const nextData = {
        ...current,
        goals: [...current.goals, goal]
      };

      saveStoredData(nextData);
      void upsertGoalsInSupabase([goal]);
      return nextData;
    });
  }, []);

  const addMilestones = useCallback((milestones: Milestone[]) => {
    setData((current) => {
      const nextData = {
        ...current,
        milestones: [...current.milestones, ...milestones]
      };

      saveStoredData(nextData);
      void upsertMilestonesInSupabase(milestones);
      return nextData;
    });
  }, []);

  const addWeeklyAction = useCallback((action: WeeklyAction) => {
    setData((current) => {
      const nextData = {
        ...current,
        weeklyActions: [...current.weeklyActions, action]
      };

      saveStoredData(nextData);
      void upsertWeeklyActionsInSupabase([action]);
      return nextData;
    });
  }, []);

  const addWeeklyActions = useCallback((actions: WeeklyAction[]) => {
    setData((current) => {
      const nextData = {
        ...current,
        weeklyActions: [...current.weeklyActions, ...actions]
      };

      saveStoredData(nextData);
      void upsertWeeklyActionsInSupabase(actions);
      return nextData;
    });
  }, []);

  const removeWeeklyAction = useCallback((actionId: string) => {
    setData((current) => {
      const nextData = {
        ...current,
        weeklyActions: current.weeklyActions.filter((action) => action.id !== actionId)
      };

      saveStoredData(nextData);
      void deleteWeeklyActionFromSupabase(actionId);
      return nextData;
    });
  }, []);

  const updateGoal = useCallback((goalId: string, updates: Partial<Goal>) => {
    setData((current) => {
      const nextData = {
        ...current,
        goals: current.goals.map((goal) => (goal.id === goalId ? { ...goal, ...updates } : goal))
      };

      saveStoredData(nextData);
      void upsertGoalsInSupabase(nextData.goals.filter((goal) => goal.id === goalId));
      return nextData;
    });
  }, []);

  const deleteGoal = useCallback((goalId: string) => {
    setData((current) => {
      const nextData = {
        goals: current.goals.filter((goal) => goal.id !== goalId),
        milestones: current.milestones.filter((milestone) => milestone.goalId !== goalId),
        weeklyActions: current.weeklyActions.filter((action) => action.goalId !== goalId),
        executionLogs: current.executionLogs
      };

      saveStoredData(nextData);
      void deleteGoalFromSupabase(goalId);
      return nextData;
    });
  }, []);

  const updateMilestone = useCallback((milestoneId: string, updates: Partial<Milestone>) => {
    setData((current) => {
      const nextData = {
        ...current,
        milestones: current.milestones.map((milestone) =>
          milestone.id === milestoneId ? { ...milestone, ...updates } : milestone
        )
      };

      saveStoredData(nextData);
      void upsertMilestonesInSupabase(nextData.milestones.filter((milestone) => milestone.id === milestoneId));
      return nextData;
    });
  }, []);

  const deleteMilestone = useCallback((milestoneId: string) => {
    setData((current) => {
      // Simpler safe approach: deleting a milestone also removes weekly actions linked to it,
      // so users do not keep orphaned actions that point to a missing milestone.
      const nextData = {
        ...current,
        milestones: current.milestones.filter((milestone) => milestone.id !== milestoneId),
        weeklyActions: current.weeklyActions.filter((action) => action.milestoneId !== milestoneId)
      };

      saveStoredData(nextData);
      void deleteMilestoneFromSupabase(milestoneId);
      return nextData;
    });
  }, []);

  const updateWeeklyAction = useCallback((actionId: string, updates: Partial<WeeklyAction>) => {
    setData((current) => {
      const nextData = {
        ...current,
        weeklyActions: current.weeklyActions.map((action) =>
          action.id === actionId ? { ...action, ...updates } : action
        )
      };

      saveStoredData(nextData);
      void upsertWeeklyActionsInSupabase(nextData.weeklyActions.filter((action) => action.id === actionId));
      return nextData;
    });
  }, []);

  const helpers = useMemo(
    () => ({
      getGoalById: (goalId: string) => data.goals.find((goal) => goal.id === goalId),
      getMilestonesForGoal: (goalId: string) =>
        data.milestones.filter((milestone) => milestone.goalId === goalId),
      getWeeklyActionsForGoal: (goalId: string) =>
        data.weeklyActions.filter((action) => action.goalId === goalId),
      getGoalProgress: (goalId: string) => {
        const goalMilestones = data.milestones.filter((milestone) => milestone.goalId === goalId);

        if (goalMilestones.length === 0) {
          return 0;
        }

        return Math.round(
          (goalMilestones.filter((milestone) => milestone.completed).length / goalMilestones.length) * 100
        );
      },
      getWeeklyActionsWithLabels: () =>
        data.weeklyActions.map((action) => ({
          ...action,
          goalTitle: data.goals.find((goal) => goal.id === action.goalId)?.title ?? "Unknown goal",
          milestoneTitle:
            data.milestones.find((milestone) => milestone.id === action.milestoneId)?.title ??
            "Unknown milestone"
        }))
    }),
    [data]
  );

  return {
    ...data,
    loaded,
    ...helpers,
    setMilestoneCompleted,
    setWeeklyActionCompleted,
    addGoal,
    addMilestones,
    addWeeklyAction,
    addWeeklyActions,
    removeWeeklyAction,
    updateGoal,
    deleteGoal,
    updateMilestone,
    deleteMilestone,
    updateWeeklyAction,
    resetDemoData
  };
}
