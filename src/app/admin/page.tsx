import prisma from "@/lib/prisma";
import Link from "next/link";
import AdminNotifications from "@/components/AdminNotifications";

export default async function AdminDashboard() {
  const [totalMembri, abbonatiAttivi, totalSlot, bookingsOggi] =
    await Promise.all([
      prisma.user.count({ where: { role: "MEMBRO" } }),
      prisma.subscription.count({ where: { attivo: true } }),
      prisma.timeSlot.count({ where: { attivo: true } }),
      prisma.booking.count({
        where: {
          data: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lte: new Date(new Date().setHours(23, 59, 59, 999)),
          },
          stato: "CONFERMATO",
        },
      }),
    ]);

  const stats = [
    { label: "Membri totali", value: totalMembri, icon: "👥", href: "/admin/membri", accent: "#0d9488" },
    { label: "Abbonamenti attivi", value: abbonatiAttivi, icon: "📋", href: "/admin/abbonamenti", accent: "#16a34a" },
    { label: "Sessioni orarie", value: totalSlot, icon: "⏰", href: "/admin/orari", accent: "#eab308" },
    { label: "Lezioni oggi", value: bookingsOggi, icon: "🏃", href: "/admin/calendario", accent: "#84cc16" },
  ];

  const shortcuts = [
    { href: "/admin/membri", icon: "👥", title: "Gestione Membri", desc: "Aggiungi, visualizza e rimuovi i membri della palestra." },
    { href: "/admin/calendario", icon: "📅", title: "Calendario Lezioni", desc: "Visualizza tutte le lezioni programmate nel calendario mensile." },
    { href: "/admin/orari", icon: "⏰", title: "Gestione Orari", desc: "Configura le sessioni orarie disponibili per le lezioni settimanali." },
    { href: "/admin/abbonamenti", icon: "📋", title: "Abbonamenti", desc: "Crea e gestisci gli abbonamenti mensili con sessioni fisse." },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "rgba(255,252,242,0.4)" }}>
          Pannello Admin
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: "#fffcf2" }}>
          Dashboard
        </h1>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="no-underline">
            <div
              className="glass p-5 flex items-center gap-4 cursor-pointer"
              style={{ borderLeft: `3px solid ${s.accent}` }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                style={{ background: `${s.accent}22` }}
              >
                {s.icon}
              </div>
              <div>
                <p className="text-2xl font-extrabold" style={{ color: "#fffcf2" }}>{s.value}</p>
                <p className="text-xs font-medium" style={{ color: "rgba(255,252,242,0.5)" }}>{s.label}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <AdminNotifications />

      {/* Shortcuts grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {shortcuts.map((sc) => (
          <Link key={sc.href} href={sc.href} className="no-underline">
            <div className="glass p-6 cursor-pointer h-full">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xl">{sc.icon}</span>
                <h2 className="font-bold text-base" style={{ color: "#fffcf2" }}>{sc.title}</h2>
              </div>
              <p className="text-sm" style={{ color: "rgba(255,252,242,0.5)" }}>{sc.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

