import CalendarView from "@/components/CalendarView";

export default function AdminCalendarioPage() {
  return (
    <div>
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "rgba(255,252,242,0.4)" }}>Admin</p>
        <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: "#fffcf2" }}>Calendario Lezioni</h1>
      </div>
      <div className="glass p-4">
        <CalendarView isAdmin={true} />
      </div>
    </div>
  );
}
