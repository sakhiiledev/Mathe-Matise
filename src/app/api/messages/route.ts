import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleError } from "@/lib/api-helpers";
import { z } from "zod";

const SendMessageSchema = z.object({
  receiverId: z.string(),
  content: z.string().min(1).max(2000),
});

export async function GET(req: NextRequest) {
  try {
    const { error, session } = await requireAuth();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const withUserId = searchParams.get("withUserId");

    if (!withUserId) {
      // Return conversation list (unique contacts)
      const sent = await prisma.message.findMany({
        where: { senderId: session!.user.id },
        select: { receiver: { select: { id: true, name: true, avatarUrl: true, role: true } }, createdAt: true, content: true, isRead: true },
        orderBy: { createdAt: "desc" },
      });

      const received = await prisma.message.findMany({
        where: { receiverId: session!.user.id },
        select: { sender: { select: { id: true, name: true, avatarUrl: true, role: true } }, createdAt: true, content: true, isRead: true },
        orderBy: { createdAt: "desc" },
      });

      // Build unique contacts map
      const contactMap = new Map<string, { id: string; name: string; avatarUrl: string | null; role: string; lastMessage: string; lastMessageAt: Date; unreadCount: number }>();

      for (const msg of sent) {
        const u = msg.receiver;
        if (!contactMap.has(u.id)) {
          contactMap.set(u.id, { ...u, lastMessage: msg.content, lastMessageAt: msg.createdAt, unreadCount: 0 });
        }
      }
      for (const msg of received) {
        const u = msg.sender;
        const existing = contactMap.get(u.id);
        if (!existing || msg.createdAt > existing.lastMessageAt) {
          contactMap.set(u.id, {
            ...u,
            lastMessage: msg.content,
            lastMessageAt: msg.createdAt,
            unreadCount: existing ? existing.unreadCount + (msg.isRead ? 0 : 1) : (msg.isRead ? 0 : 1),
          });
        }
      }

      return NextResponse.json({ data: Array.from(contactMap.values()) });
    }

    // Return conversation with specific user
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: session!.user.id, receiverId: withUserId },
          { senderId: withUserId, receiverId: session!.user.id },
        ],
      },
      orderBy: { createdAt: "asc" },
      include: {
        sender: { select: { id: true, name: true, avatarUrl: true } },
        receiver: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    // Mark received messages as read
    await prisma.message.updateMany({
      where: { senderId: withUserId, receiverId: session!.user.id, isRead: false },
      data: { isRead: true },
    });

    return NextResponse.json({ data: messages });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { error, session } = await requireAuth();
    if (error) return error;

    const body = await req.json();
    const { receiverId, content } = SendMessageSchema.parse(body);

    if (receiverId === session!.user.id) {
      return NextResponse.json({ error: "Cannot send message to yourself" }, { status: 400 });
    }

    const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
    if (!receiver) return NextResponse.json({ error: "Recipient not found" }, { status: 404 });

    const message = await prisma.message.create({
      data: { senderId: session!.user.id, receiverId, content },
      include: {
        sender: { select: { id: true, name: true, avatarUrl: true } },
        receiver: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    // Create notification for receiver
    await prisma.notification.create({
      data: {
        userId: receiverId,
        message: `New message from ${session!.user.name}`,
        type: "INFO",
        link: `/messages`,
      },
    });

    return NextResponse.json({ data: message, message: "Message sent" }, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
