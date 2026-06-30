import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { creaNotifica, creaNotificaAdmin } from "@/lib/notifications";
import { getLessonPackTotalFromType, isIndividualSubscriptionType } from "@/lib/subscriptions";

function schemaDayIndex(date: Date) {
  // JS: 0=Dom..6=Sab -> schema: 0=Lun..6=Dom
  return (date.getDay() + 6) % 7;
}

// POST /api/bookings - prenota una lezione scegliendo solo l'orario su una data
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  const { data, slotId } = await req.json();
  if (!data || !slotId) {
    return NextResponse.json({ error: "Dati mancanti" }, { status: 400 });
  }

  const bookingDate = new Date(`${data}T00:00:00`);
  if (Number.isNaN(bookingDate.getTime())) {
    return NextResponse.json({ error: "Data non valida" }, { status: 400 });
  }

  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const bookingDateKey = `${bookingDate.getFullYear()}-${String(bookingDate.getMonth() + 1).padStart(2, "0")}-${String(bookingDate.getDate()).padStart(2, "0")}`;

  if (bookingDateKey < today) {
    return NextResponse.json({ error: "Non puoi prenotare una lezione in una data passata" }, { status: 400 });
  }

  const subscription = await prisma.subscription.findUnique({
    where: { userId: session.userId },
  });

  if (!subscription || !subscription.attivo) {
    return NextResponse.json({ error: "Nessun abbonamento attivo" }, { status: 400 });
  }

  const isIndividual = isIndividualSubscriptionType(subscription.tipo);
  if (!isIndividual && bookingDateKey !== today) {
    return NextResponse.json({ error: "Con abbonamento di gruppo puoi prenotare solo la lezione di oggi da questa schermata" }, { status: 400 });
  }

  if (isIndividual) {
    const lessonPackTotal = getLessonPackTotalFromType(subscription.tipo);
    if (lessonPackTotal !== null) {
      const usedLessons = await prisma.booking.count({
        where: {
          subscriptionId: subscription.id,
          stato: { in: ["CONFERMATO", "PRESENTE"] },
        },
      });

      if (usedLessons >= lessonPackTotal) {
        return NextResponse.json({ error: "Hai terminato le lezioni del tuo pacchetto individuale" }, { status: 400 });
      }
    }
  }

  const slot = await prisma.timeSlot.findUnique({ where: { id: Number(slotId) } });
  if (!slot || !slot.attivo) {
    return NextResponse.json({ error: "Sessione non valida" }, { status: 400 });
  }

  if (schemaDayIndex(bookingDate) !== slot.giornoSettimana) {
    return NextResponse.json({ error: "La sessione non appartiene al giorno selezionato" }, { status: 400 });
  }

  const existingForDay = await prisma.booking.findFirst({
    where: {
      subscriptionId: subscription.id,
      data: {
        gte: new Date(`${data}T00:00:00`),
        lte: new Date(`${data}T23:59:59`),
      },
      stato: { in: ["CONFERMATO", "PRESENTE"] },
    },
  });

  if (existingForDay) {
    return NextResponse.json({ error: "Hai gia una lezione prenotata per questo giorno" }, { status: 400 });
  }

  const attendees = await prisma.booking.count({
    where: {
      slotId: slot.id,
      data: {
        gte: new Date(`${data}T00:00:00`),
        lte: new Date(`${data}T23:59:59`),
      },
      stato: { in: ["CONFERMATO", "PRESENTE"] },
    },
  });

  if (attendees >= slot.maxPartecipanti) {
    return NextResponse.json({ error: "Sessione piena" }, { status: 400 });
  }

  const created = await prisma.booking.create({
    data: {
      subscriptionId: subscription.id,
      slotId: slot.id,
      data: bookingDate,
      stato: "CONFERMATO",
    },
  });

  await creaNotifica(
    session.userId,
    "Lezione prenotata",
    `Hai prenotato una lezione per il ${bookingDate.toLocaleDateString("it-IT")} alle ${slot.oraInizio}.`
  );

  await creaNotificaAdmin(
    "Nuova prenotazione lezione",
    `${session.nome} ${session.cognome} ha prenotato la lezione del ${bookingDate.toLocaleDateString("it-IT")} alle ${slot.oraInizio}.`
  );

  return NextResponse.json(created, { status: 201 });
}
