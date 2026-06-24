import { getSession } from "@/lib/session";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { GIORNI } from "@/lib/booking";
import MembroNotifications from "@/components/MembroNotifications";

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

  const lessonCount = await prisma.booking.count({
    where: {
      subscription: { userId: session.userId },
      stato: "PRESENTE",
    },
  });

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "rgba(255,252,242,0.4)" }}>
          Area personale
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: "#fffcf2" }}>
          Ciao, {session.nome}! 👋
        </h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Abbonamento */}
        <div className="glass p-5" style={{ borderLeft: "3px solid #0d9488" }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "rgba(255,252,242,0.4)" }}>Abbonamento</p>
          {user?.subscription ? (
            <>
              <p className="text-lg font-extrabold" style={{ color: "#60a5fa" }}>
                {user.subscription.tipo === "DUE_LEZIONI" ? "2 lezioni/sett." : "3 lezioni/sett."}
              </p>
              <p className="text-xs mt-1" style={{ color: "rgba(255,252,242,0.45)" }}>
                Scade: {format(new Date(user.subscription.dataFine), "dd MMMM yyyy", { locale: it })}
              </p>
              <span className={`badge mt-2 ${user.subscription.attivo ? "badge-green" : "badge-gray"}`}>
                {user.subscription.attivo ? "Attivo" : "Scaduto"}
              </span>
            </>
          ) : (
            <p style={{ color: "rgba(255,252,242,0.4)" }}>Nessun abbonamento</p>
          )}
        </div>

        {/* Prossima lezione */}
        <div className="glass p-5" style={{ borderLeft: "3px solid #22c55e" }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "rgba(255,252,242,0.4)" }}>Prossima lezione</p>
          {prossimaLezione ? (
            <>
              <p className="text-lg font-extrabold capitalize" style={{ color: "#4ade80" }}>
                {format(new Date(prossimaLezione.data), "EEEE dd MMM", { locale: it })}
              </p>
              <p className="text-sm mt-0.5" style={{ color: "rgba(255,252,242,0.6)" }}>
                {prossimaLezione.slot.oraInizio} – {prossimaLezione.slot.oraFine}
              </p>
            </>
          ) : (
            <p style={{ color: "rgba(255,252,242,0.4)" }}>Nessuna in programma</p>
          )}
        </div>

        {/* Presenze */}
        <div className="glass p-5" style={{ borderLeft: "3px solid #a855f7" }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "rgba(255,252,242,0.4)" }}>Lezioni frequentate</p>
          <p className="text-3xl font-extrabold" style={{ color: "#c084fc" }}>{lessonCount}</p>
          <p className="text-xs mt-0.5" style={{ color: "rgba(255,252,242,0.4)" }}>Presenze registrate</p>
        </div>
      </div>

      {/* Slot fissi */}
      {user?.subscription && (
        <div className="glass p-5 mb-6">
          <h2 className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(255,252,242,0.5)" }}>I tuoi slot fissi</h2>
          <div className="flex flex-wrap gap-2">
            {user.subscription.slots.map((ss) => (
              <div
                key={ss.slotId}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium"
                style={{ background: "rgba(13,148,136,0.12)", border: "1px solid rgba(13,148,136,0.25)", color: "#5eead4" }}
              >
                <span style={{ color: "#5eead4", fontWeight: 700 }}>{GIORNI[ss.slot.giornoSettimana]}</span>
                <span style={{ color: "rgba(250,250,249,0.55)" }}>{ss.slot.oraInizio}–{ss.slot.oraFine}</span>
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
              <h2 className="font-bold text-base" style={{ color: "#fffcf2" }}>Il mio calendario</h2>
            </div>
            <p className="text-sm" style={{ color: "rgba(255,252,242,0.5)" }}>
              Visualizza le tue lezioni e modifica gli orari
            </p>
          </div>
        </Link>
        <Link href="/membro/abbonamento" className="no-underline">
          <div className="glass p-6 cursor-pointer">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xl">📋</span>
              <h2 className="font-bold text-base" style={{ color: "#fffcf2" }}>Il mio abbonamento</h2>
            </div>
            <p className="text-sm" style={{ color: "rgba(255,252,242,0.5)" }}>
              Dettagli abbonamento e slot fissi
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
