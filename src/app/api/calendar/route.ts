import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

// GET /api/calendar?month=2024-06
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month"); // formato YYYY-MM

  let start: Date, end: Date;
  if (month) {
    const [y, m] = month.split("-").map(Number);
    start = new Date(y, m - 1, 1);
    end = new Date(y, m, 0, 23, 59, 59);
  } else {
    const now = new Date();
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  }

  const whereClause =
    session.role === "ADMIN"
      ? { data: { gte: start, lte: end } }
      : {
          data: { gte: start, lte: end },
          subscription: { userId: session.userId },
        };

  const bookings = await prisma.booking.findMany({
    where: whereClause,
    include: {
      slot: true,
      subscription: {
        include: {
          user: { select: { nome: true, cognome: true } },
        },
      },
    },
    orderBy: { data: "asc" },
  });

  // Trasforma in eventi FullCalendar
  const events = bookings.map((b) => {
    const dateStr = b.data.toISOString().split("T")[0];
    const title =
      session.role === "ADMIN"
        ? `${b.subscription.user.nome} ${b.subscription.user.cognome}`
        : `Lezione ${b.slot.oraInizio}`;

    return {
      id: String(b.id),
      title,
      start: `${dateStr}T${b.slot.oraInizio}:00`,
      end: `${dateStr}T${b.slot.oraFine}:00`,
      backgroundColor:
        b.stato === "CANCELLATO"
          ? "#ef4444"
          : b.stato === "PRESENTE"
          ? "#22c55e"
          : "#3b82f6",
      extendedProps: {
        stato: b.stato,
        slotId: b.slotId,
        subscriptionId: b.subscriptionId,
        bookingId: b.id,
        membro:
          session.role === "ADMIN"
            ? `${b.subscription.user.nome} ${b.subscription.user.cognome}`
            : null,
      },
    };
  });

  return NextResponse.json(events);
}
