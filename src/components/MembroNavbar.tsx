"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

const navLinks = [
  { href: "/membro", label: "Home", icon: "⊞" },
  { href: "/membro/calendario", label: "Calendario", icon: "📅" },
  { href: "/membro/abbonamento", label: "Abbonamento", icon: "📋" },
];

export default function MembroNavbar({ nome, cognome }: { nome: string; cognome: string }) {
  const router = useRouter();
  const pathname = usePathname();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <nav
      style={{
        background: "rgba(37,36,34,0.85)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderBottom: "1px solid rgba(13,148,136,0.2)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <div className="container mx-auto px-5 flex items-center justify-between h-16">
        <div className="flex items-center gap-7">
          <Link href="/membro" className="flex items-center gap-2 no-underline">
            <span className="text-xl font-extrabold tracking-wide" style={{ color: "#84cc16" }}>
              🏋️ Palestra
            </span>
          </Link>
          <div className="flex items-center gap-1">
            {navLinks.map((l) => {
              const active = pathname === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all no-underline"
                  style={{
                    background: active ? "rgba(132,204,22,0.12)" : "transparent",
                    color: active ? "#84cc16" : "rgba(250,250,249,0.65)",
                    borderBottom: active ? "2px solid #84cc16" : "2px solid transparent",
                  }}
                >
                  <span className="text-xs">{l.icon}</span> {l.label}
                </Link>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
            style={{ background: "rgba(13,148,136,0.12)", border: "1px solid rgba(13,148,136,0.25)", color: "#5eead4" }}
          >
            <span>👤</span> {nome} {cognome}
          </div>
          <button
            onClick={logout}
            className="text-xs font-semibold px-3 py-1.5 rounded-full transition-all"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}
          >
            Esci
          </button>
        </div>
      </div>
    </nav>
  );
}
