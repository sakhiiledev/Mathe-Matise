import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleError } from "@/lib/api-helpers";
import { Role } from "@prisma/client";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error, session } = await requireAuth();
    if (error) return error;

    const assessment = await prisma.assessment.findUnique({
      where: { id: params.id },
      include: {
        subject: true,
        grade: true,
        creator: { select: { id: true, name: true } },
        questions: { orderBy: { order: "asc" } },
        _count: { select: { submissions: true } },
      },
    });

    if (!assessment) return NextResponse.json({ error: "Assessment not found" }, { status: 404 });

    // Learners: strip correct answers for non-submitted assessments
    if (session!.user.role === Role.LEARNER) {
      if (!assessment.isPublished) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      const sanitised = {
        ...assessment,
        questions: assessment.questions.map((q) => ({
          ...q,
          correctAnswer: undefined,
        })),
      };
      return NextResponse.json({ data: sanitised });
    }

    return NextResponse.json({ data: assessment });
  } catch (err) {
    return handleError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error, session } = await requireAuth([Role.TUTOR, Role.ADMIN]);
    if (error) return error;

    const body = await req.json();
    const assessment = await prisma.assessment.findUnique({ where: { id: params.id } });

    if (!assessment) return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    if (session!.user.role !== Role.ADMIN && assessment.createdBy !== session!.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.assessment.update({
      where: { id: params.id },
      data: body,
      include: { subject: true, grade: true, _count: { select: { questions: true, submissions: true } } },
    });

    return NextResponse.json({ data: updated, message: "Assessment updated" });
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error, session } = await requireAuth([Role.TUTOR, Role.ADMIN]);
    if (error) return error;

    const assessment = await prisma.assessment.findUnique({ where: { id: params.id } });
    if (!assessment) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (session!.user.role !== Role.ADMIN && assessment.createdBy !== session!.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.assessment.delete({ where: { id: params.id } });

    return NextResponse.json({ message: "Assessment deleted" });
  } catch (err) {
    return handleError(err);
  }
}
