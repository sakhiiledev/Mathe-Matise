import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleError } from "@/lib/api-helpers";
import { Role } from "@prisma/client";
import { z } from "zod";

const EnrollSchema = z.object({
  learnerId: z.string(),
  subjectId: z.string(),
});

export async function GET(req: NextRequest) {
  try {
    const { error, session } = await requireAuth();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const learnerId = searchParams.get("learnerId");

    // Learners can only see their own enrollments
    const targetId =
      session!.user.role === Role.LEARNER ? session!.user.id : (learnerId ?? undefined);

    const enrollments = await prisma.enrollment.findMany({
      where: { ...(targetId && { learnerId: targetId }) },
      include: {
        subject: { include: { grade: true } },
        learner: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
      orderBy: { enrolledAt: "desc" },
    });

    return NextResponse.json({ data: enrollments });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { error } = await requireAuth([Role.ADMIN]);
    if (error) return error;

    const body = await req.json();
    const { learnerId, subjectId } = EnrollSchema.parse(body);

    const enrollment = await prisma.enrollment.create({
      data: { learnerId, subjectId },
      include: { subject: { include: { grade: true } } },
    });

    return NextResponse.json(
      { data: enrollment, message: "Learner enrolled successfully" },
      { status: 201 }
    );
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { error } = await requireAuth([Role.ADMIN]);
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Enrollment ID required" }, { status: 400 });

    await prisma.enrollment.delete({ where: { id } });

    return NextResponse.json({ message: "Enrollment removed" });
  } catch (err) {
    return handleError(err);
  }
}
