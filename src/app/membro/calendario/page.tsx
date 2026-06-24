import CalendarView from "@/components/CalendarView";

export default function MembroCalendarioPage() {
  return (
    <div>
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "rgba(255,252,242,0.4)" }}>Area personale</p>
        <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: "#fffcf2" }}>Il mio calendario</h1>
      </div>
      <div className="glass p-4">
        <CalendarView isAdmin={false} />
      </div>
    </div>
  );
}
