import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleError } from "@/lib/api-helpers";
import { Role } from "@prisma/client";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error, session } = await requireAuth([Role.TUTOR, Role.ADMIN]);
    if (error) return error;

    const event = await prisma.calendarEvent.findUnique({ where: { id: params.id } });
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
    if (session!.user.role !== Role.ADMIN && event.createdBy !== session!.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const updated = await prisma.calendarEvent.update({
      where: { id: params.id },
      data: {
        ...body,
        ...(body.startTime && { startTime: new Date(body.startTime) }),
        ...(body.endTime && { endTime: new Date(body.endTime) }),
      },
      include: { attendees: { include: { user: { select: { id: true, name: true } } } } },
    });

    return NextResponse.json({ data: updated, message: "Event updated" });
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error, session } = await requireAuth([Role.TUTOR, Role.ADMIN]);
    if (error) return error;

    const event = await prisma.calendarEvent.findUnique({ where: { id: params.id } });
    if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (session!.user.role !== Role.ADMIN && event.createdBy !== session!.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.calendarEvent.delete({ where: { id: params.id } });

    return NextResponse.json({ message: "Event deleted" });
  } catch (err) {
    return handleError(err);
  }
}
