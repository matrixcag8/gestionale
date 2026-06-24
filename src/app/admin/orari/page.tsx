"use client";

import { useState, useEffect } from "react";
import { GIORNI } from "@/lib/booking";

type TimeSlot = {
  id: number;
  giornoSettimana: number;
  oraInizio: string;
  oraFine: string;
  maxPartecipanti: number;
  attivo: boolean;
};

const GIORNO_COLORS = ["#0066cc","#0066cc","#ff7a1f","#ff7a1f","#a855f7","#22c55e","#f59e0b"];

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(0,102,204,0.25)",
  borderRadius: "12px",
  padding: "0.65rem 0.9rem",
  color: "#fffcf2",
  fontFamily: "Montserrat, sans-serif",
  fontSize: "0.85rem",
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.7rem",
  fontWeight: 600,
  textTransform: "uppercase" as const,
  letterSpacing: "0.08em",
  marginBottom: "6px",
  color: "rgba(255,252,242,0.45)",
};

export default function OrariPage() {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ giornoSettimana: "0", oraInizio: "08:00", oraFine: "09:00", maxPartecipanti: "15" });
  const [saving, setSaving] = useState(false);

  async function loadSlots() {
    const res = await fetch("/api/slots");
    setSlots(await res.json());
    setLoading(false);
  }

  useEffect(() => { loadSlots(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    await fetch("/api/slots", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, giornoSettimana: parseInt(form.giornoSettimana), maxPartecipanti: parseInt(form.maxPartecipanti) }),
    });
    setSaving(false); setShowForm(false); loadSlots();
  }

  async function handleDelete(id: number) {
    if (!confirm("Disattivare questo slot?")) return;
    await fetch(`/api/slots/${id}`, { method: "DELETE" });
    loadSlots();
  }

  const grouped = GIORNI.map((g, i) => ({ giorno: g, index: i, slots: slots.filter((s) => s.giornoSettimana === i) }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: "rgba(255,252,242,0.4)" }}>Admin</p>
          <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: "#fffcf2" }}>Orari Lezioni</h1>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-cta text-sm">
          {showForm ? "✕ Annulla" : "+ Nuovo Slot"}
        </button>
      </div>

      {showForm && (
        <div className="glass p-6 mb-6">
          <h2 className="font-bold mb-4 text-base" style={{ color: "#fffcf2" }}>Aggiungi Slot Orario</h2>
          <form onSubmit={handleAdd} className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label style={labelStyle}>Giorno</label>
              <select value={form.giornoSettimana} onChange={(e) => setForm({ ...form, giornoSettimana: e.target.value })} style={inputStyle}>
                {GIORNI.map((g, i) => <option key={i} value={i}>{g}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Ora inizio</label>
              <input type="time" value={form.oraInizio} onChange={(e) => setForm({ ...form, oraInizio: e.target.value })} required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Ora fine</label>
              <input type="time" value={form.oraFine} onChange={(e) => setForm({ ...form, oraFine: e.target.value })} required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Max partecipanti</label>
              <input type="number" min="1" max="50" value={form.maxPartecipanti} onChange={(e) => setForm({ ...form, maxPartecipanti: e.target.value })} style={inputStyle} />
            </div>
            <div className="col-span-2 md:col-span-4">
              <button type="submit" disabled={saving} className="btn-cta text-sm">{saving ? "Salvo..." : "✓ Aggiungi Slot"}</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-16" style={{ color: "rgba(255,252,242,0.35)" }}>Caricamento...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {grouped.filter((g) => g.slots.length > 0).map((g) => (
            <div key={g.index} className="glass p-5" style={{ borderTop: `3px solid ${GIORNO_COLORS[g.index]}` }}>
              <h2 className="font-bold text-sm uppercase tracking-wider mb-3" style={{ color: GIORNO_COLORS[g.index] }}>{g.giorno}</h2>
              <div className="space-y-2">
                {g.slots.map((s) => (
                  <div key={s.id} className="flex items-center justify-between rounded-xl px-3 py-2"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,252,242,0.07)" }}>
                    <div>
                      <span className="font-semibold text-sm" style={{ color: "#fffcf2" }}>{s.oraInizio} – {s.oraFine}</span>
                      <span className="text-xs ml-2" style={{ color: "rgba(255,252,242,0.4)" }}>max {s.maxPartecipanti}</span>
                    </div>
                    <button onClick={() => handleDelete(s.id)} className="text-xs w-6 h-6 rounded-full flex items-center justify-center transition"
                      style={{ color: "#f87171", background: "rgba(239,68,68,0.1)" }} title="Disattiva">✕</button>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {slots.length === 0 && (
            <div className="col-span-4 text-center py-16" style={{ color: "rgba(255,252,242,0.3)" }}>Nessuno slot configurato</div>
          )}
        </div>
      )}
    </div>
  );
}
