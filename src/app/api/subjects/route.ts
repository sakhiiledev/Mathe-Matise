import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleError } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  try {
    const { error } = await requireAuth();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const gradeId = searchParams.get("gradeId");

    const subjects = await prisma.subject.findMany({
      where: gradeId ? { gradeId } : undefined,
      include: { grade: true },
      orderBy: [{ grade: { order: "asc" } }, { name: "asc" }],
    });

    return NextResponse.json({ data: subjects });
  } catch (err) {
    return handleError(err);
  }
}
