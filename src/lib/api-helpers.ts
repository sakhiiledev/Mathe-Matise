import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { ZodError } from "zod";

export async function getSession() {
  return getServerSession(authOptions);
}

export async function requireAuth(allowedRoles?: Role[]) {
  const session = await getSession();
  if (!session?.user) {
    return { error: NextResponse.json({ error: "Unauthorised" }, { status: 401 }), session: null };
  }
  if (allowedRoles && !allowedRoles.includes(session.user.role)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }), session: null };
  }
  return { error: null, session };
}

export function handleError(err: unknown) {
  console.error(err);
  if (err instanceof ZodError) {
    return NextResponse.json(
      { error: "Validation error", details: err.flatten() },
      { status: 422 }
    );
  }
  if (err instanceof Error) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

export function paginate(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") ?? "20")));
  return { skip: (page - 1) * pageSize, take: pageSize, page, pageSize };
}
