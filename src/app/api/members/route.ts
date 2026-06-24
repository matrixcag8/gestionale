import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/session";

// GET /api/members
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  const members = await prisma.user.findMany({
    where: { role: "MEMBRO" },
    select: {
      id: true,
      nome: true,
      cognome: true,
      email: true,
      telefono: true,
      createdAt: true,
      subscription: {
        select: {
          id: true,
          tipo: true,
          dataInizio: true,
          dataFine: true,
          attivo: true,
          slots: {
            select: {
              slotId: true,
              slot: {
                select: {
                  id: true,
                  giornoSettimana: true,
                  oraInizio: true,
                  oraFine: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { cognome: "asc" },
  });

  return NextResponse.json(members);
}

// POST /api/members
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  const { nome, cognome, email, password, telefono } = await req.json();
  if (!nome || !cognome || !email || !password) {
    return NextResponse.json({ error: "Campi obbligatori mancanti" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email già registrata" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { nome, cognome, email, passwordHash, telefono, role: "MEMBRO" },
    select: { id: true, nome: true, cognome: true, email: true, telefono: true },
  });

  return NextResponse.json(user, { status: 201 });
}
