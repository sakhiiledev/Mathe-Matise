import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleError } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  try {
    const { error } = await requireAuth();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const withSubjects = searchParams.get("withSubjects") === "true";

    const grades = await prisma.grade.findMany({
      orderBy: { order: "asc" },
      include: withSubjects ? { subjects: true } : undefined,
    });

    return NextResponse.json({ data: grades });
  } catch (err) {
    return handleError(err);
  }
}
