"use client";

import { useEffect, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import itLocale from "@fullcalendar/core/locales/it";
import { format } from "date-fns";
import { it } from "date-fns/locale";

type CalEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor: string;
  extendedProps: {
    stato: string;
    slotId: number;
    subscriptionId: number;
    bookingId: number;
    membro: string | null;
  };
};

type TimeSlot = {
  id: number;
  giornoSettimana: number;
  oraInizio: string;
  oraFine: string;
};

const GIORNI = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

export default function CalendarView({ isAdmin }: { isAdmin: boolean }) {
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [currentMonth, setCurrentMonth] = useState(
    format(new Date(), "yyyy-MM")
  );
  const [selectedEvent, setSelectedEvent] = useState<CalEvent | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [newSlotId, setNewSlotId] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const calRef = useRef<FullCalendar>(null);

  async function loadEvents(month: string) {
    const res = await fetch(`/api/calendar?month=${month}`);
    const data = await res.json();
    setEvents(data);
  }

  useEffect(() => {
    loadEvents(currentMonth);
    fetch("/api/slots")
      .then((r) => r.json())
      .then(setSlots);
  }, [currentMonth]);

  function handleDatesSet(info: { view: { currentStart: Date } }) {
    const m = format(info.view.currentStart, "yyyy-MM");
    if (m !== currentMonth) {
      setCurrentMonth(m);
    }
  }

  function handleEventClick(info: { event: { id: string; title: string; start: Date | null; end: Date | null; backgroundColor: string; extendedProps: Record<string, unknown> } }) {
    const ev = events.find((e) => e.id === info.event.id);
    if (ev) setSelectedEvent(ev);
  }

  async function handleChangeSlot() {
    if (!selectedEvent || !newSlotId) return;
    setActionLoading(true);
    setActionError(null);
    const res = await fetch(`/api/bookings/${selectedEvent.extendedProps.bookingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slotId: parseInt(newSlotId) }),
    });
    const data = await res.json();
    setActionLoading(false);
    if (!res.ok) {
      setActionError(data.error || "Errore nel cambio appuntamento");
      return;
    }
    setActionMessage("Appuntamento cambiato. Notifica inviata.");
    setSelectedEvent(null);
    setNewSlotId("");
    loadEvents(currentMonth);
  }

  async function handleCancel() {
    if (!selectedEvent) return;
    if (!confirm("Cancellare questa lezione?")) return;
    setActionLoading(true);
    setActionError(null);
    const res = await fetch(`/api/bookings/${selectedEvent.extendedProps.bookingId}`, {
      method: "DELETE",
    });
    const data = await res.json();
    setActionLoading(false);
    if (!res.ok) {
      setActionError(data.error || "Errore nella cancellazione");
      return;
    }
    setActionMessage("Lezione cancellata. Notifica inviata.");
    setSelectedEvent(null);
    loadEvents(currentMonth);
  }

  async function handleSetPresente() {
    if (!selectedEvent || !isAdmin) return;
    setActionLoading(true);
    setActionError(null);
    const res = await fetch(`/api/bookings/${selectedEvent.extendedProps.bookingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stato: "PRESENTE" }),
    });
    const data = await res.json();
    setActionLoading(false);
    if (!res.ok) {
      setActionError(data.error || "Errore aggiornamento presenza");
      return;
    }
    setActionMessage("Presenza registrata e notifica inviata al membro.");
    setSelectedEvent(null);
    loadEvents(currentMonth);
  }

  const eventDate = selectedEvent ? new Date(selectedEvent.start) : null;
  const isPast = eventDate ? eventDate < new Date() : false;

  return (
    <div>
      {actionMessage && (
        <div className="mb-4 px-4 py-3 rounded-xl border text-sm"
          style={{ background: "rgba(34,197,94,0.12)", borderColor: "rgba(34,197,94,0.3)", color: "#86efac" }}>
          {actionMessage}
        </div>
      )}
      {actionError && (
        <div className="mb-4 px-4 py-3 rounded-xl border text-sm"
          style={{ background: "rgba(239,68,68,0.12)", borderColor: "rgba(239,68,68,0.3)", color: "#fca5a5" }}>
          {actionError}
        </div>
      )}

      <FullCalendar
        ref={calRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        locale={itLocale}
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek",
        }}
        events={events}
        eventClick={handleEventClick}
        datesSet={handleDatesSet}
        height="auto"
        eventDisplay="block"
        dayMaxEvents={3}
      />

      {/* Modal dettaglio evento */}
      {selectedEvent && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: "rgba(10,10,10,0.7)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-md mx-4 rounded-2xl p-6"
            style={{ background: "#231f1c", border: "1px solid rgba(132,204,22,0.2)", boxShadow: "0 30px 80px rgba(0,0,0,0.6)" }}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-extrabold" style={{ color: "#fffcf2" }}>
                  {selectedEvent.title}
                </h3>
                <p className="text-sm capitalize mt-0.5" style={{ color: "rgba(255,252,242,0.5)" }}>
                  {eventDate && format(eventDate, "EEEE dd MMMM yyyy", { locale: it })}
                </p>
                <p className="text-sm mt-0.5" style={{ color: "rgba(255,252,242,0.65)" }}>
                  {selectedEvent.start.split("T")[1]?.slice(0, 5)} –{" "}
                  {selectedEvent.end?.split("T")[1]?.slice(0, 5)}
                </p>
              </div>
              <span className={`badge ${
                selectedEvent.extendedProps.stato === "CANCELLATO" ? "badge-red"
                : selectedEvent.extendedProps.stato === "PRESENTE" ? "badge-green"
                : "badge-blue"
              }`}>
                {selectedEvent.extendedProps.stato}
              </span>
            </div>

            {isAdmin && selectedEvent.extendedProps.membro && (
              <p className="text-sm mb-4" style={{ color: "rgba(255,252,242,0.6)" }}>
                👤 {selectedEvent.extendedProps.membro}
              </p>
            )}

            {/* Cambio slot */}
            {!isPast && selectedEvent.extendedProps.stato !== "CANCELLATO" && (
              <div className="mb-4">
                <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "rgba(255,252,242,0.4)" }}>
                  Cambia slot
                </label>
                <select
                  value={newSlotId}
                  onChange={(e) => setNewSlotId(e.target.value)}
                  className="input-dark w-full text-sm"
                >
                  <option value="">Seleziona nuovo slot...</option>
                  {slots.map((s) => (
                    <option key={s.id} value={s.id}>
                      {GIORNI[s.giornoSettimana]} {s.oraInizio}–{s.oraFine}
                    </option>
                  ))}
                </select>
                {newSlotId && (
                  <button
                    onClick={handleChangeSlot}
                    disabled={actionLoading}
                    className="btn-cta mt-2 w-full text-sm disabled:opacity-50"
                  >
                    {actionLoading ? "Salvo..." : "Conferma cambio slot"}
                  </button>
                )}
              </div>
            )}

            <div className="flex gap-2 flex-wrap">
              {isAdmin && selectedEvent.extendedProps.stato === "CONFERMATO" && (
                <button
                  onClick={handleSetPresente}
                  disabled={actionLoading}
                  className="flex-1 py-2 rounded-xl text-sm font-semibold transition disabled:opacity-50"
                  style={{ background: "rgba(34,197,94,0.15)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.25)" }}
                >
                  ✓ Segna presente
                </button>
              )}
              {!isPast && selectedEvent.extendedProps.stato === "CONFERMATO" && (
                <button
                  onClick={handleCancel}
                  disabled={actionLoading}
                  className="flex-1 py-2 rounded-xl text-sm font-semibold transition disabled:opacity-50"
                  style={{ background: "rgba(239,68,68,0.12)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" }}
                >
                  Cancella lezione
                </button>
              )}
              <button
                onClick={() => { setSelectedEvent(null); setNewSlotId(""); }}
                className="flex-1 py-2 rounded-xl text-sm font-semibold transition"
                style={{ background: "rgba(255,252,242,0.07)", color: "rgba(255,252,242,0.6)", border: "1px solid rgba(255,252,242,0.1)" }}
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
