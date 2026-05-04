import { MilestoneDetailPanel } from "@/components/MilestoneDetailPanel";
import { milestones } from "@/lib/goals";

export function generateStaticParams() {
  return milestones.map((milestone) => ({
    goalId: milestone.goalId,
    milestoneId: milestone.id
  }));
}

export default function MilestoneDetailPage({
  params
}: {
  params: { goalId: string; milestoneId: string };
}) {
  return <MilestoneDetailPanel goalId={params.goalId} milestoneId={params.milestoneId} />;
}
