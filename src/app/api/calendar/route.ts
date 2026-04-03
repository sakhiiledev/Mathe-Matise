import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleError } from "@/lib/api-helpers";
import { Role, EventType } from "@prisma/client";
import { z } from "zod";

const CreateEventSchema = z.object({
  title: z.string().min(2).max(200),
  type: z.enum(["CLASS", "TEST", "APPOINTMENT"]),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  notes: z.string().optional(),
  attendeeIds: z.array(z.string()).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { error, session } = await requireAuth();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    let where: Record<string, unknown> = {};

    if (session!.user.role === Role.LEARNER) {
      where = {
        OR: [
          { createdBy: session!.user.id },
          { attendees: { some: { userId: session!.user.id } } },
        ],
      };
    } else if (session!.user.role === Role.TUTOR) {
      where = { createdBy: session!.user.id };
    }

    if (from || to) {
      where.startTime = {
        ...(from && { gte: new Date(from) }),
        ...(to && { lte: new Date(to) }),
      };
    }

    const events = await prisma.calendarEvent.findMany({
      where,
      orderBy: { startTime: "asc" },
      include: {
        creator: { select: { id: true, name: true } },
        attendees: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
      },
    });

    return NextResponse.json({ data: events });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { error, session } = await requireAuth([Role.TUTOR, Role.ADMIN]);
    if (error) return error;

    const body = await req.json();
    const { attendeeIds, ...eventData } = CreateEventSchema.parse(body);

    const event = await prisma.calendarEvent.create({
      data: {
        ...eventData,
        type: eventData.type as EventType,
        startTime: new Date(eventData.startTime),
        endTime: new Date(eventData.endTime),
        createdBy: session!.user.id,
        attendees: attendeeIds
          ? { create: attendeeIds.map((userId) => ({ userId })) }
          : undefined,
      },
      include: {
        creator: { select: { id: true, name: true } },
        attendees: { include: { user: { select: { id: true, name: true } } } },
      },
    });

    // Notify attendees
    if (attendeeIds?.length) {
      await prisma.notification.createMany({
        data: attendeeIds.map((userId) => ({
          userId,
          message: `New ${eventData.type.toLowerCase()} scheduled: ${eventData.title}`,
          type: "INFO" as const,
          link: `/calendar`,
        })),
      });
    }

    return NextResponse.json({ data: event, message: "Event created" }, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
