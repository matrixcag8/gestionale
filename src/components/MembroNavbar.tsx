"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const navLinks = [
  { href: "/membro", label: "Home", icon: "⊞" },
  { href: "/membro/calendario", label: "Calendario", icon: "📅" },
  { href: "/membro/abbonamento", label: "Abbonamento", icon: "📋" },
];

export default function MembroNavbar({ nome, cognome }: { nome: string; cognome: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const saved = window.localStorage.getItem("membro-theme");
    const initial = saved === "light" || saved === "dark" ? saved : "dark";
    setTheme(initial);
  }, []);

  useEffect(() => {
    document.body.classList.remove("membro-theme-dark", "membro-theme-light");
    document.body.classList.add(theme === "light" ? "membro-theme-light" : "membro-theme-dark");
    window.localStorage.setItem("membro-theme", theme);

    return () => {
      document.body.classList.remove("membro-theme-dark", "membro-theme-light");
    };
  }, [theme]);

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
      <div className="container mx-auto px-3 sm:px-5 py-2.5 sm:py-3">
        <div className="flex items-center justify-between gap-2">
          <Link href="/membro" className="flex items-center gap-2 no-underline min-w-0">
            <span className="text-base sm:text-xl font-extrabold tracking-wide truncate" style={{ color: "#84cc16" }}>
              🏋️ Palestra
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
            style={{ background: "rgba(13,148,136,0.12)", border: "1px solid rgba(13,148,136,0.25)", color: "#5eead4" }}>
            <span>👤</span> {nome} {cognome}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
              className="text-xs font-semibold px-3 py-1.5 rounded-full transition-all"
              style={theme === "light"
                ? { background: "rgba(15,23,42,0.08)", border: "1px solid rgba(15,23,42,0.18)", color: "#0f172a" }
                : { background: "rgba(250,250,249,0.08)", border: "1px solid rgba(250,250,249,0.16)", color: "#fffcf2" }
              }
              title="Cambia tema"
            >
              {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
            </button>

            <button
              onClick={logout}
              className="text-xs font-semibold px-3 py-1.5 rounded-full transition-all"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.24)", color: "#f87171" }}
            >
              Esci
            </button>
          </div>
        </div>

        <div className="mt-2 flex items-center gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: "none" }}>
          <div className="contents">
            {navLinks.map((l) => {
              const active = pathname === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all no-underline whitespace-nowrap"
                  style={{
                    background: active ? "rgba(132,204,22,0.12)" : "transparent",
                    color: active ? "#84cc16" : theme === "light" ? "rgba(15,23,42,0.75)" : "rgba(250,250,249,0.65)",
                    borderBottom: active ? "2px solid #84cc16" : "2px solid transparent",
                    border: active
                      ? "1px solid rgba(132,204,22,0.28)"
                      : theme === "light"
                      ? "1px solid rgba(15,23,42,0.12)"
                      : "1px solid rgba(250,250,249,0.08)",
                  }}
                >
                  <span className="text-xs">{l.icon}</span> {l.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
