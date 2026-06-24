import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

// GET /api/slots
export async function GET() {
  const slots = await prisma.timeSlot.findMany({
    where: { attivo: true },
    orderBy: [{ giornoSettimana: "asc" }, { oraInizio: "asc" }],
  });
  return NextResponse.json(slots);
}

// POST /api/slots
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  const { giornoSettimana, oraInizio, oraFine, maxPartecipanti } = await req.json();
  if (giornoSettimana === undefined || !oraInizio || !oraFine) {
    return NextResponse.json({ error: "Dati mancanti" }, { status: 400 });
  }

  const slot = await prisma.timeSlot.create({
    data: {
      giornoSettimana: parseInt(giornoSettimana),
      oraInizio,
      oraFine,
      maxPartecipanti: maxPartecipanti || 15,
    },
  });

  return NextResponse.json(slot, { status: 201 });
}
