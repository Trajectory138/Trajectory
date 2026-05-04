import { GoalDetailPanel } from "@/components/GoalDetailPanel";
import { goals } from "@/lib/goals";

export function generateStaticParams() {
  return goals.map((goal) => ({ goalId: goal.id }));
}

export default async function GoalDetailPage({ params }: { params: Promise<{ goalId: string }> }) {
  const { goalId } = await params;

  return <GoalDetailPanel goalId={goalId} />;
}
