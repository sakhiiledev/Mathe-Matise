import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleError } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  try {
    const { error } = await requireAuth();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const subjectId = searchParams.get("subjectId");
    const gradeId = searchParams.get("gradeId");
    const term = searchParams.get("term");

    const topics = await prisma.capsTopic.findMany({
      where: {
        ...(subjectId && { subjectId }),
        ...(gradeId && { gradeId }),
        ...(term && { term: parseInt(term) }),
      },
      orderBy: [{ term: "asc" }, { order: "asc" }],
      include: { subject: true, grade: true },
    });

    return NextResponse.json({ data: topics });
  } catch (err) {
    return handleError(err);
  }
}
