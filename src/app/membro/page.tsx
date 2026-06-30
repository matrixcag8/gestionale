import { getSession } from "@/lib/session";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { endOfWeek, startOfWeek } from "date-fns";
import { GIORNI } from "@/lib/booking";
import MembroNotifications from "@/components/MembroNotifications";
import { getLessonPackTotalFromType, getWeeklyLimitFromType } from "@/lib/subscriptions";

export default async function MembroDashboard() {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      subscription: {
        include: {
          slots: { include: { slot: true } },
        },
      },
    },
  });

  const prossimaLezione = await prisma.booking.findFirst({
    where: {
      subscription: { userId: session.userId },
      data: { gte: new Date() },
      stato: "CONFERMATO",
    },
    include: { slot: true },
    orderBy: { data: "asc" },
  });

  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const [weeklyBookedLessons, totalBookedLessons] = user?.subscription
    ? await Promise.all([
        prisma.booking.count({
          where: {
            subscription: { userId: session.userId },
            stato: { in: ["CONFERMATO", "PRESENTE"] },
            data: {
              gte: weekStart,
              lte: weekEnd,
            },
          },
        }),
        prisma.booking.count({
          where: {
            subscription: { userId: session.userId },
            stato: { in: ["CONFERMATO", "PRESENTE"] },
          },
        }),
      ])
    : [0, 0];

  const weeklyLimit = getWeeklyLimitFromType(user?.subscription?.tipo ?? "");
  const lessonPackTotal = getLessonPackTotalFromType(user?.subscription?.tipo ?? "");
  const lezioniRimanenti = lessonPackTotal !== null
    ? Math.max(0, lessonPackTotal - totalBookedLessons)
    : Math.max(0, weeklyLimit - weeklyBookedLessons);
  const slotFissiBloccati = user?.subscription?.slots.length ?? 0;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>
          Area personale
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: "var(--text)" }}>
          Ciao, {session.nome}! 👋
        </h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Prossima lezione */}
        <div className="glass p-5" style={{ borderLeft: "3px solid #0d9488" }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Prossima lezione</p>
          {prossimaLezione ? (
            <>
              <p className="text-lg font-extrabold capitalize" style={{ color: "#60a5fa" }}>
                {format(new Date(prossimaLezione.data), "EEEE dd MMM", { locale: it })}
              </p>
              <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
                {prossimaLezione.slot.oraInizio} - {prossimaLezione.slot.oraFine}
              </p>
            </>
          ) : (
            <p style={{ color: "var(--text-muted)" }}>Nessuna in programma</p>
          )}
        </div>

        {/* Lezioni rimanenti e scadenza */}
        <div className="glass p-5" style={{ borderLeft: "3px solid #22c55e" }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Lezioni rimanenti</p>
          {user?.subscription ? (
            <>
              <p className="text-3xl font-extrabold" style={{ color: "#4ade80" }}>
                {lezioniRimanenti}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                Scade: {format(new Date(user.subscription.dataFine), "dd MMMM yyyy", { locale: it })}
              </p>
            </>
          ) : (
            <p style={{ color: "var(--text-muted)" }}>Nessun abbonamento</p>
          )}
        </div>

        {/* Allenamenti settimanali */}
        <div className="glass p-5" style={{ borderLeft: "3px solid #a855f7" }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Allenamenti settimanali</p>
          <p className="text-3xl font-extrabold" style={{ color: "#c084fc" }}>{slotFissiBloccati}</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Lezioni programmate a settimana</p>
        </div>
      </div>

      {/* Sessioni fisse */}
      {user?.subscription && (
        <div className="glass p-5 mb-6">
          <h2 className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>Le tue sessioni fisse</h2>
          <div className="flex flex-wrap gap-2">
            {user.subscription.slots.map((ss) => (
              <div
                key={ss.slotId}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium"
                style={{ background: "rgba(13,148,136,0.12)", border: "1px solid rgba(13,148,136,0.25)", color: "#5eead4" }}
              >
                <span style={{ color: "#5eead4", fontWeight: 700 }}>{GIORNI[ss.slot.giornoSettimana]}</span>
                <span style={{ color: "var(--text-muted)" }}>{ss.slot.oraInizio}–{ss.slot.oraFine}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <MembroNotifications />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/membro/calendario" className="no-underline">
          <div className="glass p-6 cursor-pointer">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xl">📅</span>
              <h2 className="font-bold text-base" style={{ color: "var(--text)" }}>Il mio calendario</h2>
            </div>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Visualizza le tue lezioni e modifica gli orari
            </p>
          </div>
        </Link>
        <Link href="/membro/abbonamento" className="no-underline">
          <div className="glass p-6 cursor-pointer">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xl">📋</span>
              <h2 className="font-bold text-base" style={{ color: "var(--text)" }}>Il mio abbonamento</h2>
            </div>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Dettagli abbonamento e sessioni fisse
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
