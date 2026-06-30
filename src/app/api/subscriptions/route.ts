import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { generaBookingMensili } from "@/lib/booking";
import { getSubscriptionConfig } from "@/lib/subscriptions";

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
  if (!userId || !tipo || !dataInizio || !dataFine || !Array.isArray(slotIds)) {
    return NextResponse.json({ error: "Dati mancanti" }, { status: 400 });
  }

  const config = getSubscriptionConfig(tipo);
  if (!config) {
    return NextResponse.json({ error: "Tipo abbonamento non valido" }, { status: 400 });
  }

  const maxSlots = config.maxSlots;
  if (slotIds.length !== maxSlots) {
    return NextResponse.json(
      { error: `Devi selezionare esattamente ${maxSlots} slot` },
      { status: 400 }
    );
  }

  const startDate = new Date(dataInizio);
  const endDate = new Date(dataFine);

  const sub = await prisma.$transaction(async (tx) => {
    const existing = await tx.subscription.findUnique({ where: { userId } });

    if (!existing) {
      return tx.subscription.create({
        data: {
          userId,
          tipo,
          dataInizio: startDate,
          dataFine: endDate,
          attivo: true,
          slots: {
            create: slotIds.map((slotId: number) => ({ slotId })),
          },
        },
      });
    }

    await tx.subscription.update({
      where: { id: existing.id },
      data: {
        tipo,
        dataInizio: startDate,
        dataFine: endDate,
        attivo: true,
      },
    });

    await tx.subscriptionSlot.deleteMany({ where: { subscriptionId: existing.id } });

    if (slotIds.length > 0) {
      await tx.subscriptionSlot.createMany({
        data: slotIds.map((slotId: number) => ({ subscriptionId: existing.id, slotId })),
      });
    }

    // Ricalcola le lezioni future in base al nuovo piano/slot.
    await tx.booking.deleteMany({
      where: {
        subscriptionId: existing.id,
        data: { gte: startDate },
      },
    });

    return tx.subscription.findUniqueOrThrow({ where: { id: existing.id } });
  });

  if (slotIds.length > 0) {
    await generaBookingMensili(sub.id);
  }

  return NextResponse.json(sub, { status: 201 });
}
