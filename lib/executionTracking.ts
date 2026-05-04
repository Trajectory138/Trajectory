import type { ExecutionLog } from "@/lib/models";

const millisecondsPerDay = 1000 * 60 * 60 * 24;

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseDateKey(dateKey: string) {
  const date = new Date(`${dateKey}T12:00:00`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function addDays(dateKey: string, days: number) {
  const date = parseDateKey(dateKey);

  if (!date) {
    return dateKey;
  }

  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

function getUniqueActionIds(actionIds: string[]) {
  return Array.from(new Set(actionIds.filter(Boolean)));
}

export function getTodayDateKey(currentDate = new Date()) {
  return toDateKey(currentDate);
}

export function getCurrentWeekStartDate(currentDate = new Date()) {
  const day = currentDate.getDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;
  const monday = new Date(currentDate);
  monday.setDate(currentDate.getDate() - daysSinceMonday);

  return toDateKey(monday);
}

export function normalizeExecutionLogs(logs: ExecutionLog[] = []) {
  return logs.map((log) => {
    const completedActionIds = getUniqueActionIds(log.completedActionIds ?? []);

    return {
      ...log,
      id: log.id ?? `execution-${log.date}`,
      date: log.date ?? getTodayDateKey(),
      completedActionIds,
      completedCount: completedActionIds.length,
      note: log.note ?? "",
      createdAt: log.createdAt ?? new Date().toISOString()
    };
  });
}

export function getExecutionLogForDate(logs: ExecutionLog[], dateKey = getTodayDateKey()) {
  return logs.find((log) => log.date === dateKey);
}

export function upsertExecutionLogForCompletedAction({
  logs,
  actionId,
  dateKey = getTodayDateKey()
}: {
  logs: ExecutionLog[];
  actionId: string;
  dateKey?: string;
}) {
  const normalizedLogs = normalizeExecutionLogs(logs);
  const existingLog = getExecutionLogForDate(normalizedLogs, dateKey);

  if (!existingLog) {
    return [
      ...normalizedLogs,
      {
        id: `execution-${dateKey}`,
        date: dateKey,
        completedActionIds: [actionId],
        completedCount: 1,
        note: "",
        createdAt: new Date().toISOString()
      }
    ];
  }

  const completedActionIds = getUniqueActionIds([...existingLog.completedActionIds, actionId]);

  return normalizedLogs.map((log) =>
    log.date === dateKey
      ? {
          ...log,
          completedActionIds,
          completedCount: completedActionIds.length
        }
      : log
  );
}

export function appendExecutionLogNote({
  logs,
  note,
  dateKey = getTodayDateKey()
}: {
  logs: ExecutionLog[];
  note: string;
  dateKey?: string;
}) {
  const nextNote = note.trim();

  if (!nextNote) {
    return normalizeExecutionLogs(logs);
  }

  const normalizedLogs = normalizeExecutionLogs(logs);
  const existingLog = getExecutionLogForDate(normalizedLogs, dateKey);

  if (!existingLog) {
    return [
      ...normalizedLogs,
      {
        id: `execution-${dateKey}`,
        date: dateKey,
        completedActionIds: [],
        completedCount: 0,
        note: nextNote,
        createdAt: new Date().toISOString()
      }
    ];
  }

  return normalizedLogs.map((log) =>
    log.date === dateKey
      ? {
          ...log,
          note: log.note.trim() ? `${log.note.trim()}\n${nextNote}` : nextNote
        }
      : log
  );
}

export function getCurrentStreak(logs: ExecutionLog[], todayKey = getTodayDateKey()) {
  const normalizedLogs = normalizeExecutionLogs(logs);
  const completedDates = new Set(
    normalizedLogs.filter((log) => log.completedCount > 0).map((log) => log.date)
  );
  const startDate = completedDates.has(todayKey) ? todayKey : addDays(todayKey, -1);
  let cursor = startDate;
  let streak = 0;

  while (completedDates.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
}

export function getWeekExecutionStats({
  logs,
  weekStartDate,
  currentDate = new Date()
}: {
  logs: ExecutionLog[];
  weekStartDate: string;
  currentDate?: Date;
}) {
  const start = parseDateKey(weekStartDate);

  if (!start) {
    return {
      completedActions: 0,
      activeDays: 0
    };
  }

  const todayKey = getTodayDateKey(currentDate);
  const today = parseDateKey(todayKey);
  const daysSinceStart = today
    ? Math.max(0, Math.floor((today.getTime() - start.getTime()) / millisecondsPerDay))
    : 0;
  const weekDates = new Set(
    Array.from({ length: Math.min(daysSinceStart + 1, 7) }, (_, index) => addDays(weekStartDate, index))
  );
  const weekLogs = normalizeExecutionLogs(logs).filter((log) => weekDates.has(log.date));

  return {
    completedActions: weekLogs.reduce((total, log) => total + log.completedCount, 0),
    activeDays: weekLogs.filter((log) => log.completedCount > 0).length
  };
}

export function hasExecutionHistory(logs: ExecutionLog[]) {
  return normalizeExecutionLogs(logs).some((log) => log.completedCount > 0 || log.note.trim().length > 0);
}
