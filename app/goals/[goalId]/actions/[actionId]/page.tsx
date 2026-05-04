import { WeeklyActionDetailPanel } from "@/components/WeeklyActionDetailPanel";
import { weeklyActions } from "@/lib/goals";

export function generateStaticParams() {
  return weeklyActions.map((action) => ({
    goalId: action.goalId,
    actionId: action.id
  }));
}

export default function WeeklyActionDetailPage({
  params
}: {
  params: { goalId: string; actionId: string };
}) {
  return <WeeklyActionDetailPanel goalId={params.goalId} actionId={params.actionId} />;
}
