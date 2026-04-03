import { PageHeader } from "@/components/layout/page-header";
import { AdminSettings } from "@/components/admin/admin-settings";

export const metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div>
      <PageHeader
        title="Platform Settings"
        description="Manage academic year, subject configuration, and notification templates."
      />
      <AdminSettings />
    </div>
  );
}
