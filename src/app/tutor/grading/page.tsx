import { PageHeader } from "@/components/layout/page-header";
import { GradingCenter } from "@/components/tutor/grading-center";

export const metadata = { title: "Grading" };

export default function TutorGradingPage() {
  return (
    <div>
      <PageHeader
        title="Grading Centre"
        description="Mark submitted assessments, enter scores, and provide written feedback."
      />
      <GradingCenter />
    </div>
  );
}
