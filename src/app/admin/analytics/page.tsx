import { PageHeader } from "@/components/layout/page-header";
import { AnalyticsDashboard } from "@/components/admin/analytics-dashboard";

export const metadata = { title: "Analytics" };

export default function AnalyticsPage() {
  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Platform performance metrics, pass rates, and learner progress."
      />
      <AnalyticsDashboard />
    </div>
  );
}
