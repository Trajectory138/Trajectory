"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { EmptyState } from "@/components/EmptyState";
import { formatDate } from "@/lib/format";
import type { Goal, Milestone } from "@/lib/models";
import { useGoalCalendarData } from "@/lib/useGoalCalendarData";

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type CalendarItem =
  | {
      id: string;
      type: "goal";
      date: string;
      goal: Goal;
    }
  | {
      id: string;
      type: "milestone";
      date: string;
      milestone: Milestone;
      goal?: Goal;
    };

type CalendarView = "calendar" | "timeline";

function getDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthLabel(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric"
  }).format(date);
}

function getTimelineMonthLabel(dateKey: string) {
  return new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric"
  }).format(new Date(`${dateKey}T12:00:00`));
}

function getCalendarDays(monthDate: Date) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingDays = firstDay.getDay();
  const totalCells = Math.ceil((leadingDays + daysInMonth) / 7) * 7;

  return Array.from({ length: totalCells }, (_, index) => {
    const dayNumber = index - leadingDays + 1;
    const date = new Date(year, month, dayNumber);

    return {
      date,
      dateKey: getDateKey(date),
      dayNumber: date.getDate(),
      isCurrentMonth: date.getMonth() === month
    };
  });
}

export function OverviewCalendar() {
  const { goals, milestones } = useGoalCalendarData();
  const [view, setView] = useState<CalendarView>("calendar");
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const todayKey = getDateKey(new Date());
  const visibleMonthKey = getMonthKey(visibleMonth);
  const goalsById = useMemo(() => new Map(goals.map((goal) => [goal.id, goal])), [goals]);
  const calendarDays = useMemo(() => getCalendarDays(visibleMonth), [visibleMonth]);
  const calendarItems = useMemo<CalendarItem[]>(() => {
    const goalTargets: CalendarItem[] = goals
      .filter((goal) => goal.status === "active")
      .map((goal) => ({
        id: `goal-${goal.id}`,
        type: "goal",
        date: goal.targetDate,
        goal
      }));
    const milestoneItems: CalendarItem[] = milestones.map((milestone) => ({
      id: `milestone-${milestone.id}`,
      type: "milestone",
      date: milestone.dueDate,
      milestone,
      goal: goalsById.get(milestone.goalId)
    }));

    return [...goalTargets, ...milestoneItems].filter((item) => item.date);
  }, [goals, goalsById, milestones]);
  const itemsByDate = useMemo(() => {
    const grouped = new Map<string, CalendarItem[]>();

    calendarItems.forEach((item) => {
      grouped.set(item.date, [...(grouped.get(item.date) ?? []), item]);
    });

    return grouped;
  }, [calendarItems]);
  const timelineGroups = useMemo(() => {
    const sortedItems = [...calendarItems].sort((first, second) => first.date.localeCompare(second.date));
    const grouped = new Map<string, CalendarItem[]>();

    sortedItems.forEach((item) => {
      const monthKey = item.date.slice(0, 7);
      grouped.set(monthKey, [...(grouped.get(monthKey) ?? []), item]);
    });

    return Array.from(grouped.entries());
  }, [calendarItems]);
  const hasCalendarDates = goals.length > 0 || milestones.length > 0;

  function changeMonth(offset: number) {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  }

  if (!hasCalendarDates) {
    return (
      <div className="space-y-6">
        <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase text-leaf">Calendar</p>
            <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">Overview Calendar</h1>
            <p className="mt-2 max-w-2xl text-ink/70">
              See active goal targets and milestone due dates together by month.
            </p>
          </div>
          <ViewToggle view={view} onChange={setView} />
        </section>

        <section className="rounded-lg border border-line bg-white p-6 shadow-sm">
          <EmptyState
            headline={view === "timeline" ? "No timeline items yet" : "No dates on the calendar yet"}
            guidance="Create a goal or add milestones to start seeing target dates and due dates in one place."
            actions={[
              { label: "Create goal", href: "/goals/new" },
              { label: "View goals", href: "/goals", variant: "secondary" }
            ]}
          />
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase text-leaf">Calendar</p>
          <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">Overview Calendar</h1>
          <p className="mt-2 max-w-2xl text-ink/70">
            See active goal targets and milestone due dates together by month.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:items-end">
          <ViewToggle view={view} onChange={setView} />
          {view === "calendar" ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => changeMonth(-1)}
                className="rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-ink/70 transition hover:border-leaf hover:text-leaf"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => changeMonth(1)}
                className="rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-ink/70 transition hover:border-leaf hover:text-leaf"
              >
                Next
              </button>
            </div>
          ) : null}
        </div>
      </section>

      {view === "calendar" ? (
        <CalendarMonthView
          calendarDays={calendarDays}
          itemsByDate={itemsByDate}
          todayKey={todayKey}
          visibleMonth={visibleMonth}
          visibleMonthKey={visibleMonthKey}
        />
      ) : (
        <TimelineView groups={timelineGroups} />
      )}
    </div>
  );
}

function ViewToggle({ view, onChange }: { view: CalendarView; onChange: (view: CalendarView) => void }) {
  return (
    <div className="inline-flex rounded-md border border-line bg-white p-1 shadow-sm">
      {(["calendar", "timeline"] as CalendarView[]).map((viewOption) => (
        <button
          key={viewOption}
          type="button"
          onClick={() => onChange(viewOption)}
          className={`rounded px-3 py-1.5 text-sm font-semibold capitalize transition ${
            view === viewOption ? "bg-leaf text-white" : "text-ink/70 hover:bg-white hover:text-ink"
          }`}
        >
          {viewOption}
        </button>
      ))}
    </div>
  );
}

function CalendarMonthView({
  calendarDays,
  itemsByDate,
  todayKey,
  visibleMonth,
  visibleMonthKey
}: {
  calendarDays: ReturnType<typeof getCalendarDays>;
  itemsByDate: Map<string, CalendarItem[]>;
  todayKey: string;
  visibleMonth: Date;
  visibleMonthKey: string;
}) {
  return (
    <section className="rounded-lg border border-line bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold">{getMonthLabel(visibleMonth)}</h2>
        <div className="flex flex-wrap gap-2 text-xs font-semibold text-ink/60">
          <span className="rounded-md border border-line bg-leaf px-2 py-1 text-white">Goal target</span>
          <span className="rounded-md border border-line bg-sky px-2 py-1 text-ink">Milestone</span>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto">
        <div className="min-w-[720px]">
          <div className="grid grid-cols-7 border-y border-line bg-paper">
            {weekdays.map((weekday) => (
              <div key={weekday} className="px-3 py-2 text-xs font-semibold uppercase text-ink/60">
                {weekday}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 border-l border-line">
            {calendarDays.map((day) => {
              const dayItems = itemsByDate.get(day.dateKey) ?? [];
              const isToday = day.dateKey === todayKey;

              return (
                <div
                  key={`${visibleMonthKey}-${day.dateKey}`}
                  className={`min-h-32 border-b border-r border-line p-2 ${
                    day.isCurrentMonth ? "bg-white" : "bg-paper text-ink/40"
                  } ${isToday ? "ring-2 ring-inset ring-leaf" : ""}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${
                        isToday ? "bg-leaf text-white" : "text-ink/70"
                      }`}
                    >
                      {day.dayNumber}
                    </span>
                    {dayItems.length > 0 ? (
                      <span className="text-xs font-semibold text-ink/40">{dayItems.length}</span>
                    ) : null}
                  </div>

                  {dayItems.length > 0 ? (
                    <ul className="mt-2 space-y-1.5">
                      {dayItems.map((item) => (
                        <li key={item.id}>
                          <CalendarItemLink item={item} />
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function TimelineView({ groups }: { groups: Array<[string, CalendarItem[]]> }) {
  return (
    <section className="rounded-lg border border-line bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Timeline</h2>
          <p className="mt-1 text-sm text-ink/60">Goal targets and milestone due dates in order.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold text-ink/60">
          <span className="rounded-md border border-line bg-leaf px-2 py-1 text-white">Goal target</span>
          <span className="rounded-md border border-line bg-sky px-2 py-1 text-ink">Milestone</span>
        </div>
      </div>

      <div className="mt-5 space-y-6">
        {groups.map(([monthKey, items]) => (
          <section key={monthKey} className="space-y-3">
            <h3 className="text-sm font-semibold uppercase text-ink/60">
              {getTimelineMonthLabel(`${monthKey}-01`)}
            </h3>
            <ol className="space-y-2">
              {items.map((item) => (
                <li key={item.id}>
                  <TimelineItemLink item={item} />
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </section>
  );
}

function TimelineItemLink({ item }: { item: CalendarItem }) {
  if (item.type === "goal") {
    return (
      <Link
        href={`/goals/${item.goal.id}`}
        className="grid gap-3 rounded-lg border border-line bg-paper p-3 transition hover:border-leaf hover:bg-white sm:grid-cols-[8rem_1fr_auto] sm:items-center"
      >
        <div className="text-sm font-semibold">{formatDate(item.date)}</div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase text-leaf">Goal target</p>
          <p className="mt-1 truncate font-semibold text-ink">{item.goal.title}</p>
        </div>
        <span className="inline-flex w-fit rounded-md bg-leaf px-2 py-1 text-xs font-semibold capitalize text-white">
          {item.goal.status.replace("_", " ")}
        </span>
      </Link>
    );
  }

  const statusClassName = item.milestone.completed
    ? "bg-successSoft text-success border border-success/30"
    : "bg-sky text-ink border border-sky";

  return (
    <Link
      href={`/goals/${item.milestone.goalId}/milestones/${item.milestone.id}`}
      className="grid gap-3 rounded-lg border border-line bg-white p-3 transition hover:border-leaf hover:bg-white sm:grid-cols-[8rem_1fr_auto] sm:items-center"
    >
      <div className="text-sm font-semibold">{formatDate(item.date)}</div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase text-ink/60">Milestone</p>
        <p className="mt-1 truncate font-semibold text-ink">{item.milestone.title}</p>
        <p className="mt-1 truncate text-sm text-ink/60">{item.goal?.title ?? "Unknown goal"}</p>
      </div>
      <span className={`inline-flex w-fit rounded-md px-2 py-1 text-xs font-semibold ${statusClassName}`}>
        {item.milestone.completed ? "Complete" : "Incomplete"}
      </span>
    </Link>
  );
}

function CalendarItemLink({ item }: { item: CalendarItem }) {
  if (item.type === "goal") {
    return (
      <Link
        href={`/goals/${item.goal.id}`}
        className="block rounded-md border border-leaf/25 bg-leaf px-2 py-1.5 text-xs font-semibold text-white transition hover:bg-ink"
      >
        <span className="block uppercase">Goal target</span>
        <span className="mt-0.5 block truncate">{item.goal.title}</span>
        <span className="mt-0.5 block text-white/75">{item.goal.status}</span>
      </Link>
    );
  }

  const milestoneClassName = item.milestone.completed
    ? "block rounded-md border border-success/30 bg-successSoft px-2 py-1.5 text-xs font-semibold text-success transition hover:border-leaf hover:bg-white hover:text-ink"
    : "block rounded-md border border-line bg-sky px-2 py-1.5 text-xs font-semibold text-ink transition hover:border-leaf hover:bg-white";

  return (
    <Link
      href={`/goals/${item.milestone.goalId}/milestones/${item.milestone.id}`}
      className={milestoneClassName}
    >
      <span className="block uppercase">Milestone</span>
      <span className="mt-0.5 block truncate">{item.milestone.title}</span>
      <span className="mt-0.5 block truncate text-ink/60">
        {item.goal?.title ?? "Unknown goal"} · {item.milestone.completed ? "Complete" : "Incomplete"}
      </span>
      <span className="sr-only">Due {formatDate(item.milestone.dueDate)}</span>
    </Link>
  );
}
