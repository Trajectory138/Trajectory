const millisecondsPerDay = 1000 * 60 * 60 * 24;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function parseGoalDate(value?: string) {
  if (!value) {
    return undefined;
  }

  const date = value.includes("T") ? new Date(value) : new Date(`${value}T12:00:00`);

  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function getDateProgressPercentage({
  startDate,
  endDate,
  currentDate = new Date()
}: {
  startDate?: string;
  endDate?: string;
  currentDate?: Date;
}) {
  const start = parseGoalDate(startDate);
  const end = parseGoalDate(endDate);

  if (!start || !end) {
    return 0;
  }

  const totalDuration = end.getTime() - start.getTime();

  if (!Number.isFinite(totalDuration) || totalDuration <= 0) {
    return 0;
  }

  const elapsedDuration = currentDate.getTime() - start.getTime();
  const percentage = Math.round((elapsedDuration / totalDuration) * 100);

  return clamp(Number.isFinite(percentage) ? percentage : 0, 0, 100);
}

export function getDaysUntilDate(dateValue?: string, currentDate = new Date()) {
  const target = parseGoalDate(dateValue);

  if (!target) {
    return 0;
  }

  return Math.ceil((target.getTime() - currentDate.getTime()) / millisecondsPerDay);
}
