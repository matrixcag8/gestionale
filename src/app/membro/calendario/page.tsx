import CalendarView from "@/components/CalendarView";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

export default async function MembroCalendarioPage() {
  const session = await getSession();
  if (!session) return null;

  const subscription = await prisma.subscription.findUnique({
    where: { userId: session.userId },
    select: { tipo: true },
  });

  return (
    <div>
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "rgba(255,252,242,0.4)" }}>Area personale</p>
        <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: "#fffcf2" }}>Il mio calendario</h1>
      </div>
      <div className="glass p-4">
        <CalendarView isAdmin={false} memberSubscriptionType={subscription?.tipo ?? null} />
      </div>
    </div>
  );
}
