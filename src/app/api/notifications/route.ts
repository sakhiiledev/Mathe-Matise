import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleError } from "@/lib/api-helpers";

export async function GET(_req: NextRequest) {
  try {
    const { error, session } = await requireAuth();
    if (error) return error;

    const notifications = await prisma.notification.findMany({
      where: { userId: session!.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: session!.user.id, isRead: false },
    });

    return NextResponse.json({ data: notifications, unreadCount });
  } catch (err) {
    return handleError(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { error, session } = await requireAuth();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
      await prisma.notification.update({
        where: { id, userId: session!.user.id },
        data: { isRead: true },
      });
    } else {
      // Mark all as read
      await prisma.notification.updateMany({
        where: { userId: session!.user.id, isRead: false },
        data: { isRead: true },
      });
    }

    return NextResponse.json({ message: "Notifications marked as read" });
  } catch (err) {
    return handleError(err);
  }
}
