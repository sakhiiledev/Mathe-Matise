import { PageHeader } from "@/components/layout/page-header";
import { LearningMaterialsManager } from "@/components/tutor/learning-materials-manager";

export const metadata = { title: "Learning Materials" };

export default function TutorLearningPage() {
  return (
    <div>
      <PageHeader
        title="Learning Materials"
        description="Upload and manage PDFs, videos, and documents for your learners."
      />
      <LearningMaterialsManager />
    </div>
  );
}
