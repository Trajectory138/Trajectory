import Link from "next/link";

const steps = [
  {
    title: "Set a goal",
    body: "Name the outcome, the reason it matters, and the date you are aiming for."
  },
  {
    title: "Break it into milestones",
    body: "Turn the goal into checkpoints so progress is visible before the finish line."
  },
  {
    title: "Execute today's move",
    body: "Choose the next meaningful action and keep the day focused on finishing it."
  }
];

const features = [
  {
    title: "Today's Move",
    body: "A single primary action so the day starts with clarity."
  },
  {
    title: "Milestone planning",
    body: "Clear checkpoints that show what progress looks like."
  },
  {
    title: "Weekly action queue",
    body: "A focused plan for what can actually move this week."
  },
  {
    title: "Daily execution streak",
    body: "Simple feedback for showing up and completing meaningful work."
  },
  {
    title: "Calendar and timeline overview",
    body: "See goal targets and milestone dates in one practical view."
  }
];

export default function LandingPage() {
  return (
    <div className="space-y-16">
      <section className="relative overflow-hidden rounded-lg border border-line bg-white px-5 py-16 shadow-sm sm:px-8 lg:px-10">
        <div className="absolute inset-0 opacity-35" aria-hidden="true">
          <div className="absolute right-4 top-6 w-[36rem] max-w-full rounded-lg border border-line bg-paper p-4 shadow-sm">
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 28 }, (_, index) => (
                <div
                  key={index}
                  className={`min-h-14 rounded-md border border-line bg-white p-2 ${
                    index === 9 ? "border-l-4 border-l-leaf bg-successSoft" : ""
                  }`}
                >
                  {index === 9 ? <div className="h-2 w-16 rounded-full bg-leaf" /> : null}
                  {index === 16 ? <div className="h-2 w-12 rounded-full bg-warning" /> : null}
                  {index === 23 ? <div className="h-2 w-14 rounded-full bg-sky" /> : null}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative max-w-3xl">
          <p className="text-sm font-semibold uppercase text-leaf">Trajectory</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-normal text-ink sm:text-5xl">
            Turn big goals into today's next move.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-ink/70 sm:text-lg">
            Trajectory helps you break goals into milestones, plan weekly actions, and stay focused
            on the one move that matters today.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/goals/new"
              className="inline-flex items-center justify-center rounded-md bg-leaf px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-ink"
            >
              Start planning
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-md border border-line bg-white px-5 py-3 text-sm font-semibold text-ink/70 transition hover:border-leaf hover:text-leaf"
            >
              View today's move
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
        <div>
          <p className="text-sm font-semibold uppercase text-leaf">The problem</p>
          <h2 className="mt-2 text-2xl font-semibold">Goals do not fail in the abstract.</h2>
        </div>
        <p className="text-base leading-7 text-ink/70">
          Most people do not fail because they lack goals. They fail because the goal never becomes
          a clear action for this week, then today. Trajectory is not a normal calendar and it is
          not a to-do list. It is a goal execution system that keeps the next move visible.
        </p>
      </section>

      <section className="space-y-5">
        <div>
          <p className="text-sm font-semibold uppercase text-leaf">How it works</p>
          <h2 className="mt-2 text-2xl font-semibold">A simple path from target to action.</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <article key={step.title} className="rounded-lg border border-line bg-white p-5 shadow-sm">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-paper text-sm font-semibold text-leaf">
                {index + 1}
              </span>
              <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-ink/70">{step.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <div>
          <p className="text-sm font-semibold uppercase text-leaf">What it tracks</p>
          <h2 className="mt-2 text-2xl font-semibold">Everything points back to today's work.</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <article key={feature.title} className="rounded-lg border border-line bg-white p-5 shadow-sm">
              <h3 className="text-base font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-ink/70">{feature.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-line bg-white p-6 text-center shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase text-leaf">Start with one move.</p>
        <h2 className="mt-3 text-2xl font-semibold">Pick a goal, plan the week, and finish today's action.</h2>
        <div className="mt-6 flex justify-center">
          <Link
            href="/goals/new"
            className="inline-flex items-center justify-center rounded-md bg-leaf px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-ink"
          >
            Start planning
          </Link>
        </div>
      </section>
    </div>
  );
}
