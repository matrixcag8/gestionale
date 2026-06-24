import { getSession } from "@/lib/session";
import prisma from "@/lib/prisma";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { GIORNI } from "@/lib/booking";

export default async function AbbonamentoPage() {
  const session = await getSession();
  if (!session) return null;

  const subscription = await prisma.subscription.findUnique({
    where: { userId: session.userId },
    include: {
      slots: { include: { slot: true } },
    },
  });

  if (!subscription) {
    return (
      <div className="text-center py-20">
        <div className="text-5xl mb-4">📋</div>
        <h1 className="text-2xl font-extrabold mb-2" style={{ color: "#fffcf2" }}>
          Nessun abbonamento attivo
        </h1>
        <p style={{ color: "rgba(255,252,242,0.45)" }}>
          Contatta la palestra per attivare il tuo abbonamento.
        </p>
      </div>
    );
  }

  const bookingStats = await prisma.booking.groupBy({
    by: ["stato"],
    where: { subscriptionId: subscription.id },
    _count: true,
  });

  const stats = {
    CONFERMATO: 0,
    PRESENTE: 0,
    CANCELLATO: 0,
    ...Object.fromEntries(bookingStats.map((s) => [s.stato, s._count])),
  };

  return (
    <div>
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "rgba(255,252,242,0.4)" }}>Area personale</p>
        <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: "#fffcf2" }}>Il mio abbonamento</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Dettagli */}
        <div className="glass p-6">
          <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "rgba(255,252,242,0.45)" }}>Dettagli</h2>
          <div className="space-y-3 text-sm">
            {[
              { label: "Tipo", value: subscription.tipo === "DUE_LEZIONI" ? "2 lezioni a settimana" : "3 lezioni a settimana" },
              { label: "Data inizio", value: format(new Date(subscription.dataInizio), "dd MMMM yyyy", { locale: it }) },
              { label: "Data fine", value: format(new Date(subscription.dataFine), "dd MMMM yyyy", { locale: it }) },
            ].map((r) => (
              <div key={r.label} className="flex justify-between items-center py-2" style={{ borderBottom: "1px solid rgba(255,252,242,0.07)" }}>
                <span style={{ color: "rgba(255,252,242,0.45)" }}>{r.label}</span>
                <span className="font-semibold" style={{ color: "#fffcf2" }}>{r.value}</span>
              </div>
            ))}
            <div className="flex justify-between items-center pt-1">
              <span style={{ color: "rgba(255,252,242,0.45)" }}>Stato</span>
              <span className={`badge ${subscription.attivo ? "badge-green" : "badge-red"}`}>
                {subscription.attivo ? "Attivo ✓" : "Scaduto"}
              </span>
            </div>
          </div>
        </div>

        {/* Statistiche */}
        <div className="glass p-6">
          <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "rgba(255,252,242,0.45)" }}>Statistiche</h2>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl p-4" style={{ background: "rgba(13,148,136,0.12)", border: "1px solid rgba(13,148,136,0.2)" }}>
              <p className="text-2xl font-extrabold" style={{ color: "#60a5fa" }}>{stats.CONFERMATO}</p>
              <p className="text-xs mt-1" style={{ color: "rgba(255,252,242,0.4)" }}>Programmate</p>
            </div>
            <div className="rounded-xl p-4" style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}>
              <p className="text-2xl font-extrabold" style={{ color: "#4ade80" }}>{stats.PRESENTE}</p>
              <p className="text-xs mt-1" style={{ color: "rgba(255,252,242,0.4)" }}>Frequentate</p>
            </div>
            <div className="rounded-xl p-4" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <p className="text-2xl font-extrabold" style={{ color: "#f87171" }}>{stats.CANCELLATO}</p>
              <p className="text-xs mt-1" style={{ color: "rgba(255,252,242,0.4)" }}>Cancellate</p>
            </div>
          </div>
        </div>
      </div>

      <div className="glass p-6">
        <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "rgba(255,252,242,0.45)" }}>Slot fissi settimanali</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {subscription.slots.map((ss) => (
            <div
              key={ss.slotId}
              className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{ background: "rgba(13,148,136,0.1)", border: "1px solid rgba(13,148,136,0.2)" }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold shrink-0"
                style={{ background: "rgba(13,148,136,0.25)", color: "#5eead4" }}>
                {GIORNI[ss.slot.giornoSettimana].slice(0, 3)}
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ color: "#fffcf2" }}>
                  {GIORNI[ss.slot.giornoSettimana]}
                </p>
                <p className="text-xs" style={{ color: "rgba(255,252,242,0.55)" }}>
                  {ss.slot.oraInizio} – {ss.slot.oraFine}
                </p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs mt-4" style={{ color: "rgba(255,252,242,0.35)" }}>
          Per cambiare i tuoi slot fissi contatta la palestra oppure modifica le singole lezioni dal calendario.
        </p>
      </div>
    </div>
  );
}
