import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { generaBookingMensili } from "@/lib/booking";

// GET /api/subscriptions
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (session.role === "MEMBRO") {
    const sub = await prisma.subscription.findUnique({
      where: { userId: session.userId },
      include: { slots: { include: { slot: true } } },
    });
    return NextResponse.json(sub);
  }

  if (userId) {
    const sub = await prisma.subscription.findUnique({
      where: { userId: parseInt(userId) },
      include: { slots: { include: { slot: true } } },
    });
    return NextResponse.json(sub);
  }

  const subs = await prisma.subscription.findMany({
    include: {
      user: { select: { nome: true, cognome: true, email: true } },
      slots: { include: { slot: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(subs);
}

// POST /api/subscriptions
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  const { userId, tipo, dataInizio, dataFine, slotIds } = await req.json();
  if (!userId || !tipo || !dataInizio || !dataFine || !slotIds?.length) {
    return NextResponse.json({ error: "Dati mancanti" }, { status: 400 });
  }

  const maxSlots = tipo === "DUE_LEZIONI" ? 2 : 3;
  if (slotIds.length !== maxSlots) {
    return NextResponse.json(
      { error: `Devi selezionare esattamente ${maxSlots} slot` },
      { status: 400 }
    );
  }

  // Disattiva abbonamento precedente se esiste
  await prisma.subscription.updateMany({
    where: { userId, attivo: true },
    data: { attivo: false },
  });

  const sub = await prisma.subscription.create({
    data: {
      userId,
      tipo,
      dataInizio: new Date(dataInizio),
      dataFine: new Date(dataFine),
      attivo: true,
      slots: {
        create: slotIds.map((slotId: number) => ({ slotId })),
      },
    },
  });

  await generaBookingMensili(sub.id);

  return NextResponse.json(sub, { status: 201 });
}
