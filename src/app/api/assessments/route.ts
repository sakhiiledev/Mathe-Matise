import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleError, paginate } from "@/lib/api-helpers";
import { Role, AssessmentType } from "@prisma/client";
import { z } from "zod";

const QuestionSchema = z.object({
  questionText: z.string().min(1),
  type: z.enum(["MCQ", "SHORT", "LONG"]),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string().optional(),
  marks: z.number().min(1),
  order: z.number().optional(),
});

const CreateAssessmentSchema = z.object({
  title: z.string().min(2).max(200),
  type: z.enum(["QUIZ", "TEST"]),
  subjectId: z.string(),
  gradeId: z.string(),
  dueDate: z.string().datetime().optional(),
  totalMarks: z.number().min(1),
  questions: z.array(QuestionSchema).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { error, session } = await requireAuth();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const { skip, take, page, pageSize } = paginate(searchParams);
    const gradeId = searchParams.get("gradeId");
    const subjectId = searchParams.get("subjectId");
    const published = searchParams.get("published");

    let where: Record<string, unknown> = {};

    if (session!.user.role === Role.LEARNER) {
      // Only show published assessments for enrolled subjects
      const enrollments = await prisma.enrollment.findMany({
        where: { learnerId: session!.user.id },
        select: { subjectId: true },
      });
      where = {
        isPublished: true,
        subjectId: { in: enrollments.map((e) => e.subjectId) },
      };
    } else if (session!.user.role === Role.TUTOR) {
      // Show assessments created by this tutor
      where = { createdBy: session!.user.id };
    }

    if (gradeId) where.gradeId = gradeId;
    if (subjectId) where.subjectId = subjectId;
    if (published !== null && session!.user.role !== Role.LEARNER) {
      where.isPublished = published === "true";
    }

    const [assessments, total] = await prisma.$transaction([
      prisma.assessment.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          subject: true,
          grade: true,
          creator: { select: { id: true, name: true } },
          _count: { select: { questions: true, submissions: true } },
        },
      }),
      prisma.assessment.count({ where }),
    ]);

    return NextResponse.json({ data: assessments, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { error, session } = await requireAuth([Role.TUTOR, Role.ADMIN]);
    if (error) return error;

    const body = await req.json();
    const { questions, ...assessmentData } = CreateAssessmentSchema.parse(body);

    const assessment = await prisma.assessment.create({
      data: {
        ...assessmentData,
        type: assessmentData.type as AssessmentType,
        dueDate: assessmentData.dueDate ? new Date(assessmentData.dueDate) : undefined,
        createdBy: session!.user.id,
        questions: questions
          ? {
              create: questions.map((q, i) => ({
                questionText: q.questionText,
                type: q.type,
                options: q.options ?? undefined,
                correctAnswer: q.correctAnswer,
                marks: q.marks,
                order: q.order ?? i + 1,
              })),
            }
          : undefined,
      },
      include: {
        subject: true,
        grade: true,
        questions: { orderBy: { order: "asc" } },
        _count: { select: { questions: true, submissions: true } },
      },
    });

    return NextResponse.json(
      { data: assessment, message: "Assessment created" },
      { status: 201 }
    );
  } catch (err) {
    return handleError(err);
  }
}
