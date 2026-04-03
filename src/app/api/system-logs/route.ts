import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleError } from "@/lib/api-helpers";
import { Role } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const { error } = await requireAuth([Role.ADMIN]);
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "50"));

    const logs = await prisma.systemLog.findMany({
      take: limit,
      orderBy: { timestamp: "desc" },
      include: { user: { select: { id: true, name: true } } },
    });

    return NextResponse.json({ data: logs });
  } catch (err) {
    return handleError(err);
  }
}
