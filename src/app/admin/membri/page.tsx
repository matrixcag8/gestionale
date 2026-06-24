"use client";

import { useState, useEffect } from "react";

type Member = {
  id: number;
  nome: string;
  cognome: string;
  email: string;
  telefono: string | null;
  subscription: {
    tipo: string;
    dataInizio: string;
    dataFine: string;
    attivo: boolean;
  } | null;
};

const inputStyle = {
  width: "100%",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(0,102,204,0.25)",
  borderRadius: "12px",
  padding: "0.7rem 1rem",
  color: "#fffcf2",
  fontFamily: "Montserrat, sans-serif",
  fontSize: "0.9rem",
  outline: "none",
};

export default function MembriPage() {
  const [membri, setMembri] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nome: "", cognome: "", email: "", password: "", telefono: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadMembri() {
    const res = await fetch("/api/members");
    setMembri(await res.json());
    setLoading(false);
  }

  useEffect(() => { loadMembri(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError("");
    const res = await fetch("/api/members", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error); return; }
    setShowForm(false);
    setForm({ nome: "", cognome: "", email: "", password: "", telefono: "" });
    loadMembri();
  }

  async function handleDelete(id: number, nome: string) {
    if (!confirm(`Eliminare ${nome}? Tutti i dati verranno cancellati.`)) return;
    await fetch(`/api/members/${id}`, { method: "DELETE" });
    loadMembri();
  }

  const tipoLabel = (tipo: string) => tipo === "DUE_LEZIONI" ? "2 lez/sett." : "3 lez/sett.";

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: "rgba(255,252,242,0.4)" }}>Admin</p>
          <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: "#fffcf2" }}>Gestione Membri</h1>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-cta text-sm"
        >
          {showForm ? "✕ Annulla" : "+ Nuovo Membro"}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="glass p-6 mb-6">
          <h2 className="font-bold text-base mb-4" style={{ color: "#fffcf2" }}>Aggiungi Membro</h2>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: "nome", placeholder: "Nome *", type: "text", required: true },
              { key: "cognome", placeholder: "Cognome *", type: "text", required: true },
              { key: "email", placeholder: "Email *", type: "email", required: true },
              { key: "password", placeholder: "Password *", type: "password", required: true },
              { key: "telefono", placeholder: "Telefono", type: "text", required: false },
            ].map((f) => (
              <input
                key={f.key}
                type={f.type}
                placeholder={f.placeholder}
                value={form[f.key as keyof typeof form]}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                required={f.required}
                style={inputStyle}
              />
            ))}
            {error && (
              <div className="md:col-span-2 text-sm px-3 py-2 rounded-xl" style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}>
                {error}
              </div>
            )}
            <div className="md:col-span-2">
              <button type="submit" disabled={saving} className="btn-cta text-sm">
                {saving ? "Salvo..." : "✓ Salva Membro"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="text-center py-16" style={{ color: "rgba(255,252,242,0.4)" }}>Caricamento...</div>
      ) : (
        <div className="glass overflow-hidden">
          <table className="w-full text-sm table-dark">
            <thead>
              <tr>
                {["Membro", "Email", "Telefono", "Abbonamento", "Azioni"].map((h) => (
                  <th key={h} className="text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {membri.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-12" style={{ color: "rgba(255,252,242,0.3)" }}>
                    Nessun membro registrato
                  </td>
                </tr>
              )}
              {membri.map((m) => (
                <tr key={m.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                        style={{ background: "rgba(0,102,204,0.2)", color: "#60a5fa" }}>
                        {m.nome[0]}{m.cognome[0]}
                      </div>
                      <span className="font-semibold" style={{ color: "#fffcf2" }}>{m.nome} {m.cognome}</span>
                    </div>
                  </td>
                  <td style={{ color: "rgba(255,252,242,0.6)" }}>{m.email}</td>
                  <td style={{ color: "rgba(255,252,242,0.6)" }}>{m.telefono || "—"}</td>
                  <td>
                    {m.subscription ? (
                      <span className={`badge ${m.subscription.attivo ? "badge-green" : "badge-gray"}`}>
                        {tipoLabel(m.subscription.tipo)}
                      </span>
                    ) : (
                      <span className="badge badge-orange">Nessuno</span>
                    )}
                  </td>
                  <td>
                    <div className="flex items-center gap-3">
                      <a href={`/admin/abbonamenti?userId=${m.id}`}
                        className="text-xs font-semibold no-underline"
                        style={{ color: "#60a5fa" }}>
                        Abbonamento
                      </a>
                      <button onClick={() => handleDelete(m.id, `${m.nome} ${m.cognome}`)}
                        className="text-xs font-semibold"
                        style={{ color: "#f87171" }}>
                        Elimina
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
