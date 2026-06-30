import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { creaNotifica, creaNotificaAdmin } from "@/lib/notifications";

// PATCH /api/bookings/[id] - cambia slot o stato
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });

  const { id } = await params;
  const bookingId = parseInt(id);
  const body = await req.json();

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { subscription: { include: { user: true } }, slot: true },
  });

  if (!booking) return NextResponse.json({ error: "Non trovato" }, { status: 404 });

  // Il membro può solo cambiare il proprio slot
  if (session.role === "MEMBRO" && booking.subscription.userId !== session.userId) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  // Cambio slot: verifica che la data non sia passata
  if (body.slotId) {
    const bookingDate = new Date(booking.data);
    if (bookingDate < new Date()) {
      return NextResponse.json(
        { error: "Non puoi modificare una lezione passata" },
        { status: 400 }
      );
    }
    const slotNuovo = await prisma.timeSlot.findUnique({
      where: { id: body.slotId },
    });

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        slotId: body.slotId,
        // Se il membro modifica l'orario, la lezione va in attesa conferma admin.
        stato: session.role === "MEMBRO" ? "IN_ATTESA" : "CONFERMATO",
      },
      include: { slot: true },
    });

    if (slotNuovo) {
      await creaNotifica(
        booking.subscription.userId,
        "Appuntamento modificato",
        `La lezione del ${new Date(booking.data).toLocaleDateString("it-IT")} e' stata spostata da ${booking.slot.oraInizio}-${booking.slot.oraFine} a ${slotNuovo.oraInizio}-${slotNuovo.oraFine}.`
      );

      if (session.role === "MEMBRO") {
        await creaNotifica(
          booking.subscription.userId,
          "Appuntamento in attesa",
          `La nuova lezione del ${new Date(booking.data).toLocaleDateString("it-IT")} alle ${slotNuovo.oraInizio} e' in attesa di conferma admin.`
        );

        await creaNotificaAdmin(
          "Cambio appuntamento membro",
          `${booking.subscription.user.nome} ${booking.subscription.user.cognome} ha spostato la lezione del ${new Date(booking.data).toLocaleDateString("it-IT")} da ${booking.slot.oraInizio}-${booking.slot.oraFine} a ${slotNuovo.oraInizio}-${slotNuovo.oraFine}. Stato: in attesa conferma.`
        );
      }
    }

    return NextResponse.json(updated);
  }

  // Cambio stato (solo admin)
  if (body.stato && session.role === "ADMIN") {
    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: { stato: body.stato },
    });

    if (body.stato === "PRESENTE") {
      await creaNotifica(
        booking.subscription.userId,
        "Presenza registrata",
        `La presenza della lezione del ${new Date(booking.data).toLocaleDateString("it-IT")} e' stata registrata.`
      );
    }

    if (body.stato === "CONFERMATO") {
      await creaNotifica(
        booking.subscription.userId,
        "Nuovo orario confermato",
        `La modifica della lezione del ${new Date(booking.data).toLocaleDateString("it-IT")} e' stata confermata dall'admin.`
      );
    }

    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "Nessuna modifica valida" }, { status: 400 });
}

// DELETE /api/bookings/[id] - cancella prenotazione
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });

  const { id } = await params;
  const bookingId = parseInt(id);

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { subscription: { include: { user: true } }, slot: true },
  });

  if (!booking) return NextResponse.json({ error: "Non trovato" }, { status: 404 });

  if (session.role === "MEMBRO" && booking.subscription.userId !== session.userId) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: { stato: "CANCELLATO" },
  });

  await creaNotifica(
    booking.subscription.userId,
    "Lezione cancellata",
    `La lezione del ${new Date(booking.data).toLocaleDateString("it-IT")} alle ${booking.slot.oraInizio} e' stata cancellata.`
  );

  return NextResponse.json({ ok: true });
}
