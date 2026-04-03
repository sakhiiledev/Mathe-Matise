import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleError } from "@/lib/api-helpers";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";

const UpdateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  isActive: z.boolean().optional(),
  avatarUrl: z.string().url().optional().nullable(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error, session } = await requireAuth();
    if (error) return error;

    // Users can only view their own profile unless admin
    if (session!.user.role !== Role.ADMIN && session!.user.id !== params.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        isActive: true,
        createdAt: true,
        enrollments: {
          include: { subject: { include: { grade: true } } },
        },
        tutorAssignments: {
          include: { subject: true, grade: true },
        },
      },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({ data: user });
  } catch (err) {
    return handleError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error, session } = await requireAuth();
    if (error) return error;

    // Only admins can update other users; users can update their own profile (limited fields)
    const isAdmin = session!.user.role === Role.ADMIN;
    const isSelf = session!.user.id === params.id;

    if (!isAdmin && !isSelf) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const data = UpdateUserSchema.parse(body);

    // Non-admins cannot change isActive
    if (!isAdmin && data.isActive !== undefined) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updateData: Record<string, unknown> = {};
    if (data.name) updateData.name = data.name;
    if (data.email) updateData.email = data.email.toLowerCase();
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl;
    if (data.password) updateData.hashedPassword = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: { id: true, name: true, email: true, role: true, avatarUrl: true, isActive: true },
    });

    return NextResponse.json({ data: user, message: "User updated successfully" });
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await requireAuth([Role.ADMIN]);
    if (error) return error;

    await prisma.user.delete({ where: { id: params.id } });

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (err) {
    return handleError(err);
  }
}
