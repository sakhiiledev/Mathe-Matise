import { PageHeader } from "@/components/layout/page-header";
import { AssessmentsManager } from "@/components/tutor/assessments-manager";

export const metadata = { title: "Assessments" };

export default function TutorAssessmentsPage() {
  return (
    <div>
      <PageHeader
        title="Assessments"
        description="Create quizzes and tests, manage questions, and publish to learners."
      />
      <AssessmentsManager />
    </div>
  );
}
