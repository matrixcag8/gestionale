"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || "Errore di accesso"); return; }
    router.push(data.role === "ADMIN" ? "/admin" : "/membro");
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: "#1c1917" }}
    >
      {/* Background gradient blobs */}
      <div
        className="absolute top-0 left-0 w-[600px] h-[600px] rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, #0d9488 0%, transparent 70%)" }}
      />
      <div
        className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full opacity-15 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, #84cc16 0%, transparent 70%)" }}
      />

      <div className="relative w-full max-w-md mx-4">
        {/* Logo & heading */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl text-4xl mb-4"
            style={{
              background: "linear-gradient(135deg, #84cc16, #65a30d)",
              boxShadow: "0 12px 40px rgba(132,204,22,0.35)",
            }}
          >
            🏋️
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: "#fffcf2" }}>
            Gestionale Palestra
          </h1>
          <p className="mt-1 text-sm" style={{ color: "rgba(255,252,242,0.55)" }}>
            Accedi al tuo account
          </p>
        </div>

        {/* Card */}
        <div className="glass p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "rgba(255,252,242,0.5)" }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-dark"
                placeholder="nome@email.it"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "rgba(255,252,242,0.5)" }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input-dark"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div
                className="px-4 py-3 rounded-xl text-sm font-medium"
                style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}
              >
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-cta w-full mt-2">
              {loading ? "Accesso in corso..." : "Accedi →"}
            </button>
          </form>

          <p className="text-center text-xs mt-6" style={{ color: "rgba(255,252,242,0.3)" }}>
            Demo → admin@palestra.it / admin123
          </p>
        </div>
      </div>
    </div>
  );
}
