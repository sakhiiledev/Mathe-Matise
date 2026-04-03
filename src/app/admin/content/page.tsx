import { PageHeader } from "@/components/layout/page-header";
import { ContentManagement } from "@/components/admin/content-management";

export const metadata = { title: "Content Management" };

export default function ContentPage() {
  return (
    <div>
      <PageHeader
        title="Content Management"
        description="Review, approve, and organise learning materials across all grades and subjects."
      />
      <ContentManagement />
    </div>
  );
}
