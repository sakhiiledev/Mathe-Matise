import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleError } from "@/lib/api-helpers";
import { Role, AnnouncementTarget } from "@prisma/client";
import { z } from "zod";

const CreateAnnouncementSchema = z.object({
  title: z.string().min(2).max(200),
  content: z.string().min(1),
  target: z.enum(["ALL", "ADMIN", "TUTOR", "LEARNER"]).default("ALL"),
});

export async function GET(_req: NextRequest) {
  try {
    const { error, session } = await requireAuth();
    if (error) return error;

    const roleToTarget: Record<Role, AnnouncementTarget[]> = {
      ADMIN: ["ALL", "ADMIN"],
      TUTOR: ["ALL", "TUTOR"],
      LEARNER: ["ALL", "LEARNER"],
    };

    const announcements = await prisma.announcement.findMany({
      where: {
        isActive: true,
        target: { in: roleToTarget[session!.user.role] },
      },
      orderBy: { createdAt: "desc" },
      include: { author: { select: { id: true, name: true } } },
    });

    return NextResponse.json({ data: announcements });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { error, session } = await requireAuth([Role.ADMIN]);
    if (error) return error;

    const body = await req.json();
    const data = CreateAnnouncementSchema.parse(body);

    const announcement = await prisma.announcement.create({
      data: { ...data, target: data.target as AnnouncementTarget, createdBy: session!.user.id },
      include: { author: { select: { id: true, name: true } } },
    });

    return NextResponse.json({ data: announcement, message: "Announcement posted" }, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
