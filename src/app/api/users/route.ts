import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleError, paginate } from "@/lib/api-helpers";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";

const CreateUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["ADMIN", "TUTOR", "LEARNER"]),
  gradeId: z.string().optional(),
  gradeIds: z.array(z.string()).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { error } = await requireAuth([Role.ADMIN]);
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const { skip, take, page, pageSize } = paginate(searchParams);
    const role = searchParams.get("role") as Role | null;
    const search = searchParams.get("search") ?? "";

    const where = {
      ...(role && { role }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      }),
    };

    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatarUrl: true,
          isActive: true,
          createdAt: true,
          _count: { select: { enrollments: true, tutorAssignments: true, submissions: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({ data: users, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { error } = await requireAuth([Role.ADMIN]);
    if (error) return error;

    const body = await req.json();
    const { name, email, password, role, gradeId, gradeIds } = CreateUserSchema.parse(body);

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email: email.toLowerCase(), hashedPassword, role: role as Role },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    // Auto-enroll learner in all subjects for their grade
    if (role === "LEARNER" && gradeId) {
      const subjects = await prisma.subject.findMany({ where: { gradeId } });
      if (subjects.length > 0) {
        await prisma.enrollment.createMany({
          data: subjects.map((s) => ({ learnerId: user.id, subjectId: s.id })),
          skipDuplicates: true,
        });
      }
    }

    // Assign tutor to all subjects across selected grades
    if (role === "TUTOR" && gradeIds && gradeIds.length > 0) {
      const subjects = await prisma.subject.findMany({
        where: { gradeId: { in: gradeIds } },
      });
      if (subjects.length > 0) {
        await prisma.tutorAssignment.createMany({
          data: subjects.map((s) => ({ tutorId: user.id, subjectId: s.id, gradeId: s.gradeId })),
          skipDuplicates: true,
        });
      }
    }

    return NextResponse.json({ data: user, message: "User created successfully" }, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
