import { PageHeader } from "@/components/layout/page-header";
import { SystemHealth } from "@/components/admin/system-health";

export const metadata = { title: "System Health" };

export default function SystemPage() {
  return (
    <div>
      <PageHeader
        title="System Health"
        description="Monitor active users, error logs, and platform health metrics."
      />
      <SystemHealth />
    </div>
  );
}
