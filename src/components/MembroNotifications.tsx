"use client";

import { useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";

type Notifica = {
  id: number;
  titolo: string;
  messaggio: string;
  letto: boolean;
  createdAt: string;
};

export default function MembroNotifications() {
  const [items, setItems] = useState<Notifica[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  async function loadNotifiche() {
    const res = await fetch("/api/notifications", { cache: "no-store" });
    if (res.ok) {
      const data = (await res.json()) as Notifica[];
      setItems(data);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadNotifiche();
    const id = setInterval(loadNotifiche, 15000);
    return () => clearInterval(id);
  }, []);

  const unreadCount = useMemo(
    () => items.filter((n) => !n.letto).length,
    [items]
  );

  async function markAllRead() {
    setUpdating(true);
    await fetch("/api/notifications", { method: "PATCH" });
    await loadNotifiche();
    setUpdating(false);
  }

  return (
    <div className="glass p-5 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: "rgba(255,252,242,0.4)" }}
          >
            Notifiche
          </p>
          <h2 className="text-lg font-extrabold" style={{ color: "#fffcf2" }}>
            Centro notifiche
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && <span className="badge badge-orange">{unreadCount} nuove</span>}
          <button
            onClick={markAllRead}
            disabled={updating || unreadCount === 0}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-40"
            style={{
              background: "rgba(255,252,242,0.08)",
              color: "rgba(255,252,242,0.7)",
              border: "1px solid rgba(255,252,242,0.12)",
            }}
          >
            {updating ? "Aggiorno..." : "Segna tutte lette"}
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm" style={{ color: "rgba(255,252,242,0.5)" }}>
          Caricamento notifiche...
        </p>
      ) : items.length === 0 ? (
        <p className="text-sm" style={{ color: "rgba(255,252,242,0.5)" }}>
          Nessuna notifica per ora.
        </p>
      ) : (
        <div className="space-y-2">
          {items.slice(0, 8).map((n) => (
            <div
              key={n.id}
              className="rounded-xl p-3"
              style={{
                background: n.letto
                  ? "rgba(255,252,242,0.03)"
                  : "rgba(132,204,22,0.1)",
                border: n.letto
                  ? "1px solid rgba(250,250,249,0.08)"
                  : "1px solid rgba(132,204,22,0.22)",
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold" style={{ color: "#fffcf2" }}>
                    {n.titolo}
                  </p>
                  <p className="text-sm" style={{ color: "rgba(255,252,242,0.65)" }}>
                    {n.messaggio}
                  </p>
                </div>
                {!n.letto && <span className="badge badge-orange">Nuova</span>}
              </div>
              <p className="text-xs mt-2" style={{ color: "rgba(255,252,242,0.35)" }}>
                {formatDistanceToNow(new Date(n.createdAt), {
                  addSuffix: true,
                  locale: it,
                })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}