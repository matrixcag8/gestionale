"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { GIORNI } from "@/lib/booking";
import { SUBSCRIPTION_TYPES, getSubscriptionConfig, getSubscriptionLabel } from "@/lib/subscriptions";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { it } from "date-fns/locale";

type Member = {
  id: number;
  nome: string;
  cognome: string;
  email: string;
  subscription: {
    id: number;
    tipo: string;
    dataInizio: string;
    dataFine: string;
    attivo: boolean;
    slots: { slotId: number; slot: { id: number; giornoSettimana: number; oraInizio: string; oraFine: string } }[];
  } | null;
};

type TimeSlot = {
  id: number;
  giornoSettimana: number;
  oraInizio: string;
  oraFine: string;
};

function AbbonamentiContent() {
  const searchParams = useSearchParams();
  const preselectedUserId = searchParams.get("userId");

  const [membri, setMembri] = useState<Member[]>([]);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedUserId, setSelectedUserId] = useState(preselectedUserId || "");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [tipo, setTipo] = useState("DUE_LEZIONI");
  const [selectedSlots, setSelectedSlots] = useState<number[]>([]);
  const [dataInizio, setDataInizio] = useState(
    format(startOfMonth(new Date()), "yyyy-MM-dd")
  );
  const [dataFine, setDataFine] = useState(
    format(endOfMonth(new Date()), "yyyy-MM-dd")
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const maxSlots = getSubscriptionConfig(tipo)?.maxSlots ?? 0;

  useEffect(() => {
    Promise.all([fetch("/api/members").then((r) => r.json()), fetch("/api/slots").then((r) => r.json())]).then(
      ([m, s]) => {
        setMembri(m);
        setSlots(s);
      }
    );
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      const m = membri.find((x) => x.id === parseInt(selectedUserId));
      setSelectedMember(m || null);
      if (m?.subscription) {
        setTipo(m.subscription.tipo);
        setSelectedSlots((m.subscription.slots ?? []).map((s) => s.slotId));
        setDataInizio(format(new Date(m.subscription.dataInizio), "yyyy-MM-dd"));
        setDataFine(format(new Date(m.subscription.dataFine), "yyyy-MM-dd"));
      } else {
        setSelectedSlots([]);
      }
    }
  }, [selectedUserId, membri]);

  function toggleSlot(id: number) {
    setSelectedSlots((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= maxSlots) return prev;
      return [...prev, id];
    });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUserId) return;
    if (maxSlots > 0 && selectedSlots.length !== maxSlots) {
      setMessage(`Seleziona esattamente ${maxSlots} slot`);
      return;
    }
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: parseInt(selectedUserId),
        tipo,
        dataInizio,
        dataFine,
        slotIds: maxSlots > 0 ? selectedSlots : [],
      }),
    });
    let data: { error?: string } = {};
    try {
      data = await res.json();
    } catch {
      data = { error: "Errore inatteso del server" };
    }
    setSaving(false);
    if (!res.ok) {
      setMessage(data.error || "Errore durante il salvataggio");
    } else {
      setMessage("✅ Abbonamento salvato e lezioni generate!");
      const mRes = await fetch("/api/members");
      setMembri(await mRes.json());
    }
  }

  const slotsByDay = GIORNI.map((g, i) => ({
    giorno: g,
    index: i,
    slots: slots.filter((s) => s.giornoSettimana === i),
  })).filter((g) => g.slots.length > 0);

  return (
    <div>
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "rgba(255,252,242,0.4)" }}>
          Admin
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: "#fffcf2" }}>
          Gestione Abbonamenti
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form abbonamento */}
        <div className="glass p-6">
          <h2 className="text-sm font-bold uppercase tracking-widest mb-5" style={{ color: "rgba(255,252,242,0.45)" }}>
            Crea / Aggiorna Abbonamento
          </h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,252,242,0.4)" }}>Membro</label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                required
                className="input-dark w-full"
              >
                <option value="">Seleziona membro...</option>
                {membri.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.cognome} {m.nome} — {m.email}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "rgba(255,252,242,0.4)" }}>Tipo abbonamento</label>
              <div className="flex gap-4">
                {SUBSCRIPTION_TYPES.map((plan) => (
                  <label key={plan.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value={plan.value}
                      checked={tipo === plan.value}
                      onChange={() => { setTipo(plan.value); setSelectedSlots([]); }}
                      className="accent-orange-500"
                    />
                    <span className="text-sm font-medium" style={{ color: "#fffcf2" }}>
                      {plan.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,252,242,0.4)" }}>Data inizio</label>
                <input type="date" value={dataInizio} onChange={(e) => setDataInizio(e.target.value)} required className="input-dark w-full" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,252,242,0.4)" }}>Data fine</label>
                <input type="date" value={dataFine} onChange={(e) => setDataFine(e.target.value)} required className="input-dark w-full" />
              </div>
            </div>

            {maxSlots > 0 ? (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "rgba(255,252,242,0.4)" }}>
                  Sessioni fisse ({selectedSlots.length}/{maxSlots} selezionate)
                </label>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {slotsByDay.map((g) => (
                    <div key={g.index}>
                      <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(255,252,242,0.3)" }}>{g.giorno}</p>
                      <div className="flex flex-wrap gap-2">
                        {g.slots.map((s) => {
                          const selected = selectedSlots.includes(s.id);
                          const disabled = !selected && selectedSlots.length >= maxSlots;
                          return (
                            <button
                              key={s.id}
                              type="button"
                              disabled={disabled}
                              onClick={() => toggleSlot(s.id)}
                              className="px-3 py-1 rounded-full text-xs font-semibold transition"
                              style={selected
                                ? { background: "rgba(132,204,22,0.2)", color: "#bef264", border: "1px solid rgba(132,204,22,0.4)" }
                                : disabled
                                ? { background: "rgba(255,252,242,0.04)", color: "rgba(255,252,242,0.2)", cursor: "not-allowed", border: "1px solid transparent" }
                                : { background: "rgba(255,252,242,0.07)", color: "rgba(255,252,242,0.6)", border: "1px solid rgba(255,252,242,0.1)" }
                              }
                            >
                              {s.oraInizio}–{s.oraFine}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-xs px-3 py-2 rounded-lg" style={{ color: "rgba(255,252,242,0.55)", background: "rgba(255,252,242,0.04)", border: "1px solid rgba(255,252,242,0.08)" }}>
                Questo piano non richiede sessioni fisse.
              </div>
            )}

            {message && (
              <div className={`text-sm p-3 rounded-xl ${message.startsWith("✅")
                ? "bg-green-500/10 text-green-400 border border-green-500/20"
                : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
                {message}
              </div>
            )}

            <button type="submit" disabled={saving} className="btn-cta w-full disabled:opacity-50">
              {saving ? "Salvo..." : "Salva Abbonamento"}
            </button>
          </form>
        </div>

        {/* Dettaglio membro selezionato */}
        {selectedMember && (
          <div className="glass p-6">
            <h2 className="text-lg font-extrabold mb-1" style={{ color: "#fffcf2" }}>
              {selectedMember.nome} {selectedMember.cognome}
            </h2>
            <p className="text-sm mb-4" style={{ color: "rgba(255,252,242,0.4)" }}>{selectedMember.email}</p>
            {selectedMember.subscription ? (
              <div>
                <div className="rounded-xl p-4 mb-4 space-y-2" style={{ background: "rgba(255,252,242,0.04)", border: "1px solid rgba(255,252,242,0.07)" }}>
                  {[
                    { l: "Tipo", v: getSubscriptionLabel(selectedMember.subscription.tipo) },
                    { l: "Inizio", v: format(new Date(selectedMember.subscription.dataInizio), "dd/MM/yyyy", { locale: it }) },
                    { l: "Fine", v: format(new Date(selectedMember.subscription.dataFine), "dd/MM/yyyy", { locale: it }) },
                  ].map(r => (
                    <div key={r.l} className="flex justify-between text-sm">
                      <span style={{ color: "rgba(255,252,242,0.4)" }}>{r.l}</span>
                      <span style={{ color: "#fffcf2" }}>{r.v}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm">
                    <span style={{ color: "rgba(255,252,242,0.4)" }}>Stato</span>
                    <span className={`badge ${selectedMember.subscription.attivo ? "badge-green" : "badge-gray"}`}>
                      {selectedMember.subscription.attivo ? "Attivo" : "Scaduto"}
                    </span>
                  </div>
                </div>
                <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(255,252,242,0.4)" }}>Sessioni fisse:</p>
                <div className="space-y-1">
                  {selectedMember.subscription.slots.map((ss) => (
                    <div key={ss.slotId} className="text-sm flex gap-2" style={{ color: "rgba(255,252,242,0.65)" }}>
                      <span style={{ color: "#93c5fd", fontWeight: 700 }}>{GIORNI[ss.slot.giornoSettimana]}</span>
                      <span>{ss.slot.oraInizio}–{ss.slot.oraFine}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm" style={{ color: "rgba(255,252,242,0.35)" }}>Nessun abbonamento attivo</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AbbonamentiPage() {
  return (
    <Suspense fallback={
      <div className="text-center py-12" style={{ color: "rgba(255,252,242,0.4)" }}>
        Caricamento...
      </div>
    }>
      <AbbonamentiContent />
    </Suspense>
  );
}
