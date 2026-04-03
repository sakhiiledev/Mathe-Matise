import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleError } from "@/lib/api-helpers";
import { Role } from "@prisma/client";
import { z } from "zod";

const GradeSchema = z.object({
  score: z.number().min(0),
  feedback: z.string().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error, session } = await requireAuth([Role.TUTOR, Role.ADMIN]);
    if (error) return error;

    const body = await req.json();
    const { score, feedback } = GradeSchema.parse(body);

    const submission = await prisma.submission.findUnique({
      where: { id: params.id },
      include: { assessment: true },
    });

    if (!submission) return NextResponse.json({ error: "Submission not found" }, { status: 404 });

    if (score > submission.assessment.totalMarks) {
      return NextResponse.json(
        { error: `Score cannot exceed total marks (${submission.assessment.totalMarks})` },
        { status: 422 }
      );
    }

    const updated = await prisma.submission.update({
      where: { id: params.id },
      data: {
        score,
        feedback,
        gradedBy: session!.user.id,
        gradedAt: new Date(),
      },
      include: {
        learner: { select: { id: true, name: true, email: true } },
        assessment: { select: { title: true, totalMarks: true } },
      },
    });

    // Notify learner
    await prisma.notification.create({
      data: {
        userId: submission.learnerId,
        message: `Your submission for "${submission.assessment.title}" has been graded. Score: ${score}/${submission.assessment.totalMarks}`,
        type: "SUCCESS",
        link: `/learner/tests`,
      },
    });

    return NextResponse.json({ data: updated, message: "Submission graded" });
  } catch (err) {
    return handleError(err);
  }
}
