import { PageHeader } from "@/components/layout/page-header";
import { UserManagement } from "@/components/admin/user-management";

export const metadata = { title: "User Management" };

export default function UsersPage() {
  return (
    <div>
      <PageHeader
        title="User Management"
        description="Create, manage, and enrol users across all portals."
      />
      <UserManagement />
    </div>
  );
}
