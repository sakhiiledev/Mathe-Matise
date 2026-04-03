import { PageHeader } from "@/components/layout/page-header";
import { LearnerTests } from "@/components/learner/learner-tests";

export const metadata = { title: "Tests & Quizzes" };

export default function LearnerTestsPage() {
  return (
    <div>
      <PageHeader
        title="Tests & Quizzes"
        description="View and attempt your available assessments."
      />
      <LearnerTests />
    </div>
  );
}
