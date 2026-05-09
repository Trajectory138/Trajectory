import { AccountSettings } from "@/components/AccountSettings";
import { ResetDemoDataButton } from "@/components/ResetDemoDataButton";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold uppercase text-leaf">Settings</p>
        <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">Settings</h1>
      </section>

      <AccountSettings />

      <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold">Demo data</h2>
            <p className="mt-1 text-sm text-ink/60">Restore the sample goals, milestones, and weekly actions.</p>
          </div>
          <ResetDemoDataButton />
        </div>
      </section>
    </div>
  );
}
