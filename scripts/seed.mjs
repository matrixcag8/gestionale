import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, "..", "dev.db");

const adapter = new PrismaLibSql({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminHash = bcrypt.hashSync("admin123", 12);
  await prisma.user.upsert({
    where: { email: "admin@palestra.it" },
    update: {},
    create: { nome: "Admin", cognome: "Palestra", email: "admin@palestra.it", passwordHash: adminHash, role: "ADMIN" },
  });

  const membroHash = bcrypt.hashSync("membro123", 12);
  await prisma.user.upsert({
    where: { email: "mario.rossi@email.it" },
    update: {},
    create: { nome: "Mario", cognome: "Rossi", email: "mario.rossi@email.it", passwordHash: membroHash, telefono: "333-1234567", role: "MEMBRO" },
  });

  const slotsData = [
    { giornoSettimana: 0, oraInizio: "08:00", oraFine: "09:00" },
    { giornoSettimana: 0, oraInizio: "18:00", oraFine: "19:00" },
    { giornoSettimana: 0, oraInizio: "19:00", oraFine: "20:00" },
    { giornoSettimana: 1, oraInizio: "08:00", oraFine: "09:00" },
    { giornoSettimana: 1, oraInizio: "18:00", oraFine: "19:00" },
    { giornoSettimana: 2, oraInizio: "08:00", oraFine: "09:00" },
    { giornoSettimana: 2, oraInizio: "18:00", oraFine: "19:00" },
    { giornoSettimana: 2, oraInizio: "19:00", oraFine: "20:00" },
    { giornoSettimana: 3, oraInizio: "08:00", oraFine: "09:00" },
    { giornoSettimana: 3, oraInizio: "18:00", oraFine: "19:00" },
    { giornoSettimana: 4, oraInizio: "08:00", oraFine: "09:00" },
    { giornoSettimana: 4, oraInizio: "18:00", oraFine: "19:00" },
    { giornoSettimana: 5, oraInizio: "09:00", oraFine: "10:00" },
    { giornoSettimana: 5, oraInizio: "10:00", oraFine: "11:00" },
  ];
  for (const s of slotsData) {
    await prisma.timeSlot.create({ data: { ...s, maxPartecipanti: 15 } });
  }

  const users = await prisma.user.count();
  const slots = await prisma.timeSlot.count();
  console.log(`✅ Seed completato! Users: ${users}, Slots: ${slots}`);
  console.log("  Admin: admin@palestra.it / admin123");
  console.log("  Membro: mario.rossi@email.it / membro123");
}

main().catch(console.error).finally(() => prisma.$disconnect());
