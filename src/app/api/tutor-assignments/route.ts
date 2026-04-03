import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleError } from "@/lib/api-helpers";
import { Role } from "@prisma/client";
import { z } from "zod";

const AssignSchema = z.object({
  tutorId: z.string(),
  subjectId: z.string(),
  gradeId: z.string(),
});

export async function GET(req: NextRequest) {
  try {
    const { error, session } = await requireAuth([Role.ADMIN, Role.TUTOR]);
    if (error) return error;

    const tutorId =
      session!.user.role === Role.TUTOR
        ? session!.user.id
        : new URL(req.url).searchParams.get("tutorId") ?? undefined;

    const assignments = await prisma.tutorAssignment.findMany({
      where: tutorId ? { tutorId } : undefined,
      include: {
        tutor: { select: { id: true, name: true, email: true } },
        subject: true,
        grade: true,
      },
    });

    return NextResponse.json({ data: assignments });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { error } = await requireAuth([Role.ADMIN]);
    if (error) return error;

    const body = await req.json();
    const data = AssignSchema.parse(body);

    const assignment = await prisma.tutorAssignment.create({
      data,
      include: { tutor: { select: { id: true, name: true } }, subject: true, grade: true },
    });

    return NextResponse.json({ data: assignment, message: "Tutor assigned" }, { status: 201 });
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
    if (!id) return NextResponse.json({ error: "Assignment ID required" }, { status: 400 });

    await prisma.tutorAssignment.delete({ where: { id } });

    return NextResponse.json({ message: "Assignment removed" });
  } catch (err) {
    return handleError(err);
  }
}
