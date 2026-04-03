"use client";

import { useSession } from "next-auth/react";
import { Role } from "@prisma/client";

interface RoleGuardProps {
  role: Role | Role[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RoleGuard({ role, children, fallback = null }: RoleGuardProps) {
  const { data: session } = useSession();
  const allowedRoles = Array.isArray(role) ? role : [role];

  if (!session?.user || !allowedRoles.includes(session.user.role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
