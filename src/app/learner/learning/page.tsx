import { PageHeader } from "@/components/layout/page-header";
import { LearnerLearning } from "@/components/learner/learner-learning";

export const metadata = { title: "Learning Materials" };

export default function LearnerLearningPage() {
  return (
    <div>
      <PageHeader
        title="Learning Materials"
        description="Access study materials for your enrolled subjects, organised by CAPS topic."
      />
      <LearnerLearning />
    </div>
  );
}
