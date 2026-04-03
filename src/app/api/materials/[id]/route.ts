import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleError } from "@/lib/api-helpers";
import { Role } from "@prisma/client";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error, session } = await requireAuth([Role.TUTOR, Role.ADMIN]);
    if (error) return error;

    const body = await req.json();
    const material = await prisma.learningMaterial.findUnique({ where: { id: params.id } });

    if (!material) return NextResponse.json({ error: "Material not found" }, { status: 404 });

    // Only admin or the uploader can update
    if (session!.user.role !== Role.ADMIN && material.uploadedBy !== session!.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.learningMaterial.update({
      where: { id: params.id },
      data: body,
      include: { subject: true, grade: true },
    });

    return NextResponse.json({ data: updated, message: "Material updated" });
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error, session } = await requireAuth([Role.TUTOR, Role.ADMIN]);
    if (error) return error;

    const material = await prisma.learningMaterial.findUnique({ where: { id: params.id } });
    if (!material) return NextResponse.json({ error: "Material not found" }, { status: 404 });

    if (session!.user.role !== Role.ADMIN && material.uploadedBy !== session!.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.learningMaterial.delete({ where: { id: params.id } });

    return NextResponse.json({ message: "Material deleted" });
  } catch (err) {
    return handleError(err);
  }
}
