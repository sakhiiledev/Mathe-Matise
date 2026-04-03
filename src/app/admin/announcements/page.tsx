import { PageHeader } from "@/components/layout/page-header";
import { AnnouncementsManager } from "@/components/admin/announcements-manager";

export const metadata = { title: "Announcements" };

export default function AnnouncementsPage() {
  return (
    <div>
      <PageHeader
        title="Announcements"
        description="Post system-wide announcements visible to all users or specific roles."
      />
      <AnnouncementsManager />
    </div>
  );
}
