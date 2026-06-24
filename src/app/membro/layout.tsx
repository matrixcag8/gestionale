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
    <div className="min-h-screen flex flex-col" style={{ background: "#1c1917" }}>
      <MembroNavbar nome={session.nome} cognome={session.cognome} />
      <main className="flex-1 container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
