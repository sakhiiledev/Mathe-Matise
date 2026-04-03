import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleError, paginate } from "@/lib/api-helpers";
import { Role, MaterialType } from "@prisma/client";
import { z } from "zod";

const CreateMaterialSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().optional(),
  fileUrl: z.string().url(),
  type: z.enum(["VIDEO", "PDF", "DOCUMENT"]),
  subjectId: z.string(),
  gradeId: z.string(),
  capsTopicId: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { error, session } = await requireAuth();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const { skip, take, page, pageSize } = paginate(searchParams);
    const gradeId = searchParams.get("gradeId");
    const subjectId = searchParams.get("subjectId");
    const capsTopicId = searchParams.get("capsTopicId");
    const type = searchParams.get("type") as MaterialType | null;
    const approved = searchParams.get("approved");

    // For learners, filter to their enrolled subjects
    let subjectFilter: string | undefined = subjectId ?? undefined;
    if (session!.user.role === Role.LEARNER) {
      const enrollments = await prisma.enrollment.findMany({
        where: { learnerId: session!.user.id },
        select: { subjectId: true },
      });
      const enrolledSubjectIds = enrollments.map((e) => e.subjectId);
      if (subjectId && !enrolledSubjectIds.includes(subjectId)) {
        return NextResponse.json({ data: [], total: 0, page, pageSize, totalPages: 0 });
      }
      subjectFilter = subjectId ?? undefined;
    }

    const where = {
      ...(gradeId && { gradeId }),
      ...(subjectFilter && { subjectId: subjectFilter }),
      ...(capsTopicId && { capsTopicId }),
      ...(type && { type }),
      ...(approved !== null && { isApproved: approved === "true" }),
    };

    const [materials, total] = await prisma.$transaction([
      prisma.learningMaterial.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          subject: true,
          grade: true,
          capsTopic: true,
          uploader: { select: { id: true, name: true } },
        },
      }),
      prisma.learningMaterial.count({ where }),
    ]);

    return NextResponse.json({ data: materials, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { error, session } = await requireAuth([Role.TUTOR, Role.ADMIN]);
    if (error) return error;

    const body = await req.json();
    const data = CreateMaterialSchema.parse(body);

    const material = await prisma.learningMaterial.create({
      data: {
        ...data,
        type: data.type as MaterialType,
        uploadedBy: session!.user.id,
        isApproved: session!.user.role === Role.ADMIN,
      },
      include: { subject: true, grade: true, capsTopic: true },
    });

    return NextResponse.json(
      { data: material, message: "Material uploaded successfully" },
      { status: 201 }
    );
  } catch (err) {
    return handleError(err);
  }
}
