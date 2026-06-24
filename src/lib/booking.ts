import { addDays, startOfMonth, endOfMonth, getDay } from "date-fns";
import prisma from "./prisma";

// Genera prenotazioni mensili per un abbonamento basate sui suoi slot fissi
export async function generaBookingMensili(subscriptionId: number) {
  const sub = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: { slots: { include: { slot: true } } },
  });
  if (!sub) return;

  const start = new Date(sub.dataInizio);
  const end = new Date(sub.dataFine);

  // Mappa giornoSettimana -> Day of week getDay() [0=Dom, 1=Lun, ...]
  // Il nostro schema usa 0=Lun, 1=Mar, ..., 6=Dom
  // getDay() usa 0=Dom, 1=Lun, ..., 6=Sab
  // Conversione: nostro 0=Lun -> getDay() 1; nostro 6=Dom -> getDay() 0
  function toGetDay(giornoSettimana: number): number {
    return giornoSettimana === 6 ? 0 : giornoSettimana + 1;
  }

  const bookingsToCreate: {
    subscriptionId: number;
    slotId: number;
    data: Date;
    stato: string;
  }[] = [];

  let current = new Date(start);
  while (current <= end) {
    for (const ss of sub.slots) {
      if (toGetDay(ss.slot.giornoSettimana) === getDay(current)) {
        const bookingDate = new Date(current);
        bookingsToCreate.push({
          subscriptionId: sub.id,
          slotId: ss.slotId,
          data: bookingDate,
          stato: "CONFERMATO",
        });
      }
    }
    current = addDays(current, 1);
  }

  // Rimuovi duplicati e booking già esistenti
  const existing = await prisma.booking.findMany({
    where: { subscriptionId },
    select: { slotId: true, data: true },
  });

  const existingKeys = new Set(
    existing.map((b) => `${b.slotId}_${b.data.toISOString().split("T")[0]}`)
  );

  const newBookings = bookingsToCreate.filter((b) => {
    const key = `${b.slotId}_${b.data.toISOString().split("T")[0]}`;
    return !existingKeys.has(key);
  });

  if (newBookings.length > 0) {
    await prisma.booking.createMany({ data: newBookings });
  }
}

export const GIORNI = [
  "Lunedì",
  "Martedì",
  "Mercoledì",
  "Giovedì",
  "Venerdì",
  "Sabato",
  "Domenica",
];

export function formatOrario(slot: { oraInizio: string; oraFine: string }) {
  return `${slot.oraInizio} - ${slot.oraFine}`;
}
