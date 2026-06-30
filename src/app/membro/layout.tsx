import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import MembroNavbar from "@/components/MembroNavbar";

export default async function MembroLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "ADMIN") redirect("/admin");

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      <MembroNavbar nome={session.nome} cognome={session.cognome} />
      <main
        className="flex-1 container mx-auto w-full px-3 sm:px-4 py-5 sm:py-8"
        style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
      >
        {children}
      </main>
    </div>
  );
}
