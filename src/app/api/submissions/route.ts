import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleError, paginate } from "@/lib/api-helpers";
import { Role } from "@prisma/client";
import { z } from "zod";

const SubmitSchema = z.object({
  assessmentId: z.string(),
  answers: z.record(z.string(), z.string()),
});

export async function GET(req: NextRequest) {
  try {
    const { error, session } = await requireAuth();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const { skip, take, page, pageSize } = paginate(searchParams);
    const assessmentId = searchParams.get("assessmentId");
    const learnerId = searchParams.get("learnerId");

    const where: Record<string, unknown> = {};

    if (session!.user.role === Role.LEARNER) {
      where.learnerId = session!.user.id;
    } else if (session!.user.role === Role.TUTOR) {
      // Tutors see submissions for their assessments
      const tutorAssessments = await prisma.assessment.findMany({
        where: { createdBy: session!.user.id },
        select: { id: true },
      });
      where.assessmentId = { in: tutorAssessments.map((a) => a.id) };
    }

    if (assessmentId) where.assessmentId = assessmentId;
    if (learnerId && session!.user.role !== Role.LEARNER) where.learnerId = learnerId;

    const [submissions, total] = await prisma.$transaction([
      prisma.submission.findMany({
        where,
        skip,
        take,
        orderBy: { submittedAt: "desc" },
        include: {
          learner: { select: { id: true, name: true, email: true, avatarUrl: true } },
          assessment: {
            include: {
              subject: { select: { name: true } },
              grade: { select: { label: true } },
            },
          },
          grader: { select: { id: true, name: true } },
        },
      }),
      prisma.submission.count({ where }),
    ]);

    return NextResponse.json({ data: submissions, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { error, session } = await requireAuth([Role.LEARNER]);
    if (error) return error;

    const body = await req.json();
    const { assessmentId, answers } = SubmitSchema.parse(body);

    // Check assessment exists and is published
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: { questions: true },
    });

    if (!assessment || !assessment.isPublished) {
      return NextResponse.json({ error: "Assessment not available" }, { status: 404 });
    }

    // Check for existing submission
    const existing = await prisma.submission.findUnique({
      where: { assessmentId_learnerId: { assessmentId, learnerId: session!.user.id } },
    });

    if (existing) {
      return NextResponse.json({ error: "You have already submitted this assessment" }, { status: 409 });
    }

    // Auto-grade MCQ questions
    let autoScore = 0;
    for (const question of assessment.questions) {
      if (question.type === "MCQ" && question.correctAnswer) {
        const answer = answers[question.id];
        if (answer === question.correctAnswer) {
          autoScore += question.marks;
        }
      }
    }

    // Check if all questions are MCQ (fully auto-gradable)
    const hasManualQuestions = assessment.questions.some((q) => q.type !== "MCQ");
    const finalScore = hasManualQuestions ? null : autoScore;

    const submission = await prisma.submission.create({
      data: {
        assessmentId,
        learnerId: session!.user.id,
        answers,
        score: finalScore,
      },
      include: {
        assessment: { select: { title: true, totalMarks: true } },
      },
    });

    return NextResponse.json(
      { data: submission, message: "Assessment submitted successfully" },
      { status: 201 }
    );
  } catch (err) {
    return handleError(err);
  }
}
