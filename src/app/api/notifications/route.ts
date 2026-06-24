import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

// GET /api/notifications - notifiche dell'utente loggato
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  const notifiche = await prisma.notification.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json(notifiche);
}

// PATCH /api/notifications - segna tutte come lette
export async function PATCH(_req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  await prisma.notification.updateMany({
    where: { userId: session.userId, letto: false },
    data: { letto: true },
  });

  return NextResponse.json({ ok: true });
}