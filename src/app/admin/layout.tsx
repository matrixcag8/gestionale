import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import AdminNavbar from "@/components/AdminNavbar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/login");

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#1c1917" }}>
      <AdminNavbar nome={session.nome} cognome={session.cognome} />
      <main className="flex-1 container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
