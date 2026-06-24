import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { addMonths } from "date-fns";

const prisma = new PrismaClient();

async function main() {
  // Admin
  const adminHash = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@palestra.it" },
    update: {},
    create: {
      nome: "Admin",
      cognome: "Palestra",
      email: "admin@palestra.it",
      passwordHash: adminHash,
      role: "ADMIN",
    },
  });
  console.log("Admin creato:", admin.email);

  // Membro di esempio
  const membroHash = await bcrypt.hash("membro123", 12);
  const membro = await prisma.user.upsert({
    where: { email: "mario.rossi@email.it" },
    update: {},
    create: {
      nome: "Mario",
      cognome: "Rossi",
      email: "mario.rossi@email.it",
      passwordHash: membroHash,
      telefono: "333-1234567",
      role: "MEMBRO",
    },
  });
  console.log("Membro creato:", membro.email);

  // Slot orari
  const slotsData = [
    { giornoSettimana: 0, oraInizio: "08:00", oraFine: "09:00" }, // Lunedì 08-09
    { giornoSettimana: 0, oraInizio: "18:00", oraFine: "19:00" }, // Lunedì 18-19
    { giornoSettimana: 0, oraInizio: "19:00", oraFine: "20:00" }, // Lunedì 19-20
    { giornoSettimana: 1, oraInizio: "08:00", oraFine: "09:00" }, // Martedì 08-09
    { giornoSettimana: 1, oraInizio: "18:00", oraFine: "19:00" }, // Martedì 18-19
    { giornoSettimana: 2, oraInizio: "08:00", oraFine: "09:00" }, // Mercoledì 08-09
    { giornoSettimana: 2, oraInizio: "18:00", oraFine: "19:00" }, // Mercoledì 18-19
    { giornoSettimana: 2, oraInizio: "19:00", oraFine: "20:00" }, // Mercoledì 19-20
    { giornoSettimana: 3, oraInizio: "08:00", oraFine: "09:00" }, // Giovedì 08-09
    { giornoSettimana: 3, oraInizio: "18:00", oraFine: "19:00" }, // Giovedì 18-19
    { giornoSettimana: 4, oraInizio: "08:00", oraFine: "09:00" }, // Venerdì 08-09
    { giornoSettimana: 4, oraInizio: "18:00", oraFine: "19:00" }, // Venerdì 18-19
    { giornoSettimana: 5, oraInizio: "09:00", oraFine: "10:00" }, // Sabato 09-10
    { giornoSettimana: 5, oraInizio: "10:00", oraFine: "11:00" }, // Sabato 10-11
  ];

  const slots = [];
  for (const s of slotsData) {
    const slot = await prisma.timeSlot.upsert({
      where: {
        id: (await prisma.timeSlot.findFirst({
          where: {
            giornoSettimana: s.giornoSettimana,
            oraInizio: s.oraInizio,
          },
          select: { id: true },
        }))?.id ?? 0,
      },
      update: {},
      create: { ...s, maxPartecipanti: 15 },
    });
    slots.push(slot);
  }
  console.log(`${slots.length} slot creati`);

  // Abbonamento per Mario (3 lezioni/settimana)
  const oggi = new Date();
  const inizioMese = new Date(oggi.getFullYear(), oggi.getMonth(), 1);
  const fineMese = new Date(oggi.getFullYear(), oggi.getMonth() + 1, 0);

  const esistente = await prisma.subscription.findUnique({
    where: { userId: membro.id },
  });

  if (!esistente) {
    const sub = await prisma.subscription.create({
      data: {
        userId: membro.id,
        tipo: "TRE_LEZIONI",
        dataInizio: inizioMese,
        dataFine: fineMese,
        attivo: true,
      },
    });

    // 3 slot fissi: Lunedì 18, Mercoledì 18, Venerdì 18
    const slotLun = await prisma.timeSlot.findFirst({
      where: { giornoSettimana: 0, oraInizio: "18:00" },
    });
    const slotMer = await prisma.timeSlot.findFirst({
      where: { giornoSettimana: 2, oraInizio: "18:00" },
    });
    const slotVen = await prisma.timeSlot.findFirst({
      where: { giornoSettimana: 4, oraInizio: "18:00" },
    });

    const slotIds = [slotLun, slotMer, slotVen].filter(Boolean);
    for (const sl of slotIds) {
      await prisma.subscriptionSlot.create({
        data: { subscriptionId: sub.id, slotId: sl!.id },
      });
    }

    console.log("Abbonamento creato per Mario con 3 slot fissi");

    // Genera booking
    const { generaBookingMensili } = await import("../src/lib/booking");
    await generaBookingMensili(sub.id);
    console.log("Booking mensili generati");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
