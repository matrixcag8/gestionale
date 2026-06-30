"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import itLocale from "@fullcalendar/core/locales/it";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { isIndividualSubscriptionType } from "@/lib/subscriptions";

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

function to12Hour(time: string) {
  const [hRaw, m] = time.split(":").map(Number);
  const suffix = hRaw >= 12 ? "PM" : "AM";
  const hour12 = hRaw % 12 === 0 ? 12 : hRaw % 12;
  return { time: `${hour12}:${String(m).padStart(2, "0")}`, suffix };
}

function getDayPeriod(time: string) {
  const hour = Number(time.split(":")[0]);
  return hour < 12 ? "mattina" : "sera";
}

export default function CalendarView({ isAdmin, memberSubscriptionType }: { isAdmin: boolean; memberSubscriptionType?: string | null }) {
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [currentMonth, setCurrentMonth] = useState(
    format(new Date(), "yyyy-MM")
  );
  const [selectedEvent, setSelectedEvent] = useState<CalEvent | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [newSlotId, setNewSlotId] = useState("");
  const [quickSlotId, setQuickSlotId] = useState("");
  const [showQuickBook, setShowQuickBook] = useState(false);
  const [quickBookingLoading, setQuickBookingLoading] = useState(false);
  const [selectedDateForBooking, setSelectedDateForBooking] = useState<string | null>(null);
  const [dateSlotId, setDateSlotId] = useState("");
  const [dateBookingLoading, setDateBookingLoading] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);
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

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setSelectedEvent(null);
        setNewSlotId("");
        setShowReschedule(false);
      }
    }

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  function handleDatesSet(info: { view: { currentStart: Date } }) {
    const m = format(info.view.currentStart, "yyyy-MM");
    if (m !== currentMonth) {
      setCurrentMonth(m);
    }
  }

  function handleEventClick(info: { event: { id: string; title: string; start: Date | null; end: Date | null; backgroundColor: string; extendedProps: Record<string, unknown> } }) {
    const ev = events.find((e) => e.id === info.event.id);
    if (ev) {
      setSelectedEvent(ev);
      setNewSlotId("");
      setShowReschedule(false);
      setActionError(null);
    }
  }

  async function handleChangeSlot() {
    if (!selectedEvent || !newSlotId) return;
    if (newSlotId === String(selectedEvent.extendedProps.slotId)) {
      setActionError("Seleziona una sessione diversa da quella attuale");
      return;
    }
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
    setShowReschedule(false);
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
    setShowReschedule(false);
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
    setShowReschedule(false);
    loadEvents(currentMonth);
  }

  async function handleConfirmPending() {
    if (!selectedEvent || !isAdmin) return;
    setActionLoading(true);
    setActionError(null);
    const res = await fetch(`/api/bookings/${selectedEvent.extendedProps.bookingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stato: "CONFERMATO" }),
    });
    const data = await res.json();
    setActionLoading(false);
    if (!res.ok) {
      setActionError(data.error || "Errore conferma appuntamento");
      return;
    }
    setActionMessage("Appuntamento confermato dall'admin.");
    setSelectedEvent(null);
    setShowReschedule(false);
    loadEvents(currentMonth);
  }

  const eventDate = selectedEvent ? new Date(selectedEvent.start) : null;
  const isPast = eventDate ? eventDate < new Date() : false;
  const canEdit = !isPast && ["CONFERMATO", "IN_ATTESA"].includes(selectedEvent?.extendedProps.stato ?? "");
  const selectedSlotLabel = selectedEvent
    ? slots.find((s) => s.id === selectedEvent.extendedProps.slotId)
    : null;
  const sortedSlots = useMemo(
    () => [...slots].sort((a, b) => a.giornoSettimana - b.giornoSettimana || a.oraInizio.localeCompare(b.oraInizio)),
    [slots]
  );

  const now = new Date();
  const todayKey = format(now, "yyyy-MM-dd");
  const todaySchemaIndex = (now.getDay() + 6) % 7;
  const todaySlots = useMemo(
    () => sortedSlots.filter((s) => s.giornoSettimana === todaySchemaIndex),
    [sortedSlots, todaySchemaIndex]
  );
  const isIndividualMemberPlan = !isAdmin && isIndividualSubscriptionType(memberSubscriptionType ?? "");
  const selectedDateObj = selectedDateForBooking ? new Date(`${selectedDateForBooking}T00:00:00`) : null;
  const selectedDateSchemaIndex = selectedDateObj ? (selectedDateObj.getDay() + 6) % 7 : null;
  const selectedDateSlots = useMemo(
    () => (selectedDateSchemaIndex === null ? [] : sortedSlots.filter((s) => s.giornoSettimana === selectedDateSchemaIndex)),
    [sortedSlots, selectedDateSchemaIndex]
  );
  const eventStart12 = selectedEvent ? to12Hour(selectedEvent.start.split("T")[1]?.slice(0, 5)) : null;
  const eventEnd12 = selectedEvent?.end ? to12Hour(selectedEvent.end.split("T")[1]?.slice(0, 5)) : null;

  async function handleQuickBookToday() {
    if (!quickSlotId) return;
    setQuickBookingLoading(true);
    setActionError(null);

    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: todayKey, slotId: parseInt(quickSlotId) }),
    });

    const data = await res.json();
    setQuickBookingLoading(false);

    if (!res.ok) {
      setActionError(data.error || "Errore durante la prenotazione");
      return;
    }

    setActionMessage("Lezione di oggi prenotata con successo.");
    setShowQuickBook(false);
    setQuickSlotId("");
    loadEvents(currentMonth);
  }

  function handleDateClick(info: { date: Date; dateStr: string }) {
    if (!isIndividualMemberPlan) return;

    const clicked = new Date(`${info.dateStr}T00:00:00`);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    if (clicked < todayStart) {
      setActionError("Non puoi prenotare in una data passata");
      return;
    }

    setSelectedDateForBooking(info.dateStr);
    setDateSlotId("");
    setActionError(null);
    setActionMessage(null);
  }

  async function handleBookSelectedDate() {
    if (!selectedDateForBooking || !dateSlotId) return;
    setDateBookingLoading(true);
    setActionError(null);

    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: selectedDateForBooking, slotId: parseInt(dateSlotId) }),
    });

    const data = await res.json();
    setDateBookingLoading(false);
    if (!res.ok) {
      setActionError(data.error || "Errore durante la prenotazione");
      return;
    }

    setActionMessage("Lezione prenotata con successo.");
    setSelectedDateForBooking(null);
    setDateSlotId("");
    loadEvents(currentMonth);
  }

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

      {!isAdmin && !isIndividualMemberPlan && (
        <div className="calendar-quick-book mb-4">
          <div className="calendar-quick-book-head">
            <div>
              <p className="calendar-quick-book-title">Prenota lezione di oggi</p>
              <p className="calendar-quick-book-subtitle">
                {GIORNI[todaySchemaIndex]} - {format(now, "dd/MM/yyyy")}
              </p>
            </div>
            <button
              type="button"
              className="calendar-hud-action"
              onClick={() => setShowQuickBook((prev) => !prev)}
            >
              {showQuickBook ? "Chiudi" : "Prenota"}
            </button>
          </div>

          {showQuickBook && (
            <div className="calendar-quick-book-body">
              {todaySlots.length === 0 ? (
                <p className="calendar-quick-book-empty">Nessuna sessione disponibile oggi.</p>
              ) : (
                <>
                  <label className="calendar-hud-select-label">Orario</label>
                  <select
                    value={quickSlotId}
                    onChange={(e) => setQuickSlotId(e.target.value)}
                    className="input-dark w-full text-sm"
                  >
                    <option value="">Seleziona orario...</option>
                    {todaySlots.map((s) => (
                      <option key={s.id} value={s.id}>
                        {getDayPeriod(s.oraInizio)} - {to12Hour(s.oraInizio).time} ({to12Hour(s.oraInizio).suffix})
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    className="btn-cta mt-2 text-sm"
                    disabled={quickBookingLoading || !quickSlotId}
                    onClick={handleQuickBookToday}
                  >
                    {quickBookingLoading ? "Prenoto..." : "Conferma prenotazione"}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {!isAdmin && isIndividualMemberPlan && (
        <div className="calendar-quick-book mb-4">
          <div className="calendar-quick-book-head">
            <div>
              <p className="calendar-quick-book-title">Prenotazione individuale</p>
              <p className="calendar-quick-book-subtitle">
                Clicca su un giorno nel calendario e scegli l&apos;orario disponibile.
              </p>
            </div>
          </div>

          {selectedDateForBooking && (
            <div className="calendar-quick-book-body">
              <p className="calendar-quick-book-subtitle mb-2">
                Data selezionata: {selectedDateObj ? format(selectedDateObj, "EEEE dd/MM/yyyy", { locale: it }) : selectedDateForBooking}
              </p>

              {selectedDateSlots.length === 0 ? (
                <p className="calendar-quick-book-empty">Nessuna sessione disponibile per questo giorno.</p>
              ) : (
                <>
                  <label className="calendar-hud-select-label">Orario</label>
                  <select
                    value={dateSlotId}
                    onChange={(e) => setDateSlotId(e.target.value)}
                    className="input-dark w-full text-sm"
                  >
                    <option value="">Seleziona orario...</option>
                    {selectedDateSlots.map((s) => (
                      <option key={s.id} value={s.id}>
                        {getDayPeriod(s.oraInizio)} - {to12Hour(s.oraInizio).time} ({to12Hour(s.oraInizio).suffix})
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    className="btn-cta mt-2 text-sm"
                    disabled={dateBookingLoading || !dateSlotId}
                    onClick={handleBookSelectedDate}
                  >
                    {dateBookingLoading ? "Prenoto..." : "Conferma prenotazione"}
                  </button>
                </>
              )}
            </div>
          )}
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
        dateClick={isIndividualMemberPlan ? handleDateClick : undefined}
        datesSet={handleDatesSet}
        height="auto"
        eventDisplay="block"
        dayMaxEvents={3}
      />

      {/* HUD dettaglio evento */}
      {selectedEvent && (
        <div className="calendar-hud-backdrop" onClick={() => { setSelectedEvent(null); setNewSlotId(""); setShowReschedule(false); }}>
          <div className="calendar-hud" onClick={(e) => e.stopPropagation()}>
            <div className="calendar-hud-header">
              <div className="calendar-hud-title-wrap">
                <span className="calendar-hud-dot" style={{ background: selectedEvent.backgroundColor }} />
                <div>
                  <h3 className="calendar-hud-title">{selectedEvent.title}</h3>
                  <p className="calendar-hud-subtitle capitalize">
                    {eventDate && format(eventDate, "EEEE dd MMMM yyyy", { locale: it })}
                  </p>
                </div>
              </div>
              <span className={`badge ${
                selectedEvent.extendedProps.stato === "CANCELLATO" ? "badge-red"
                : selectedEvent.extendedProps.stato === "IN_ATTESA" ? "badge-orange"
                : selectedEvent.extendedProps.stato === "PRESENTE" ? "badge-green"
                : "badge-blue"
              }`}>
                {selectedEvent.extendedProps.stato}
              </span>
            </div>

            <div className="calendar-hud-section">
              <p className="calendar-hud-row">
                <span className="calendar-hud-row-label">Orario</span>
                <span>
                  {eventStart12?.time} <span className="calendar-hud-ampm">{eventStart12?.suffix}</span>
                  {" - "}
                  {eventEnd12?.time} <span className="calendar-hud-ampm">{eventEnd12?.suffix}</span>
                </span>
              </p>
              {selectedSlotLabel && (
                <p className="calendar-hud-row">
                  <span className="calendar-hud-row-label">Sessione attuale</span>
                  <span>
                    {GIORNI[selectedSlotLabel.giornoSettimana]} - {getDayPeriod(selectedSlotLabel.oraInizio)} - {to12Hour(selectedSlotLabel.oraInizio).time}
                    {" "}<span className="calendar-hud-ampm">{to12Hour(selectedSlotLabel.oraInizio).suffix}</span>
                  </span>
                </p>
              )}
            </div>

            {isAdmin && selectedEvent.extendedProps.membro && (
              <p className="calendar-hud-member">
                Membro: {selectedEvent.extendedProps.membro}
              </p>
            )}

            {canEdit && (
              <div className="calendar-hud-section">
                <div className="calendar-hud-actions-top">
                  <button
                    onClick={() => setShowReschedule((prev) => !prev)}
                    className="calendar-hud-action"
                    type="button"
                  >
                    {showReschedule ? "Annulla modifica" : "Cambia lezione"}
                  </button>
                </div>

                {showReschedule && (
                  <div className="calendar-hud-reschedule">
                    <label className="calendar-hud-select-label">Nuova sessione</label>
                    <select
                      value={newSlotId}
                      onChange={(e) => setNewSlotId(e.target.value)}
                      className="input-dark w-full text-sm"
                    >
                      <option value="">Seleziona nuova sessione...</option>
                      {sortedSlots.map((s) => (
                        <option key={s.id} value={s.id}>
                          {GIORNI[s.giornoSettimana]} - {getDayPeriod(s.oraInizio)} - {to12Hour(s.oraInizio).time} ({to12Hour(s.oraInizio).suffix})
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={handleChangeSlot}
                      disabled={actionLoading || !newSlotId}
                      className="btn-cta mt-2 w-full text-sm disabled:opacity-50"
                      type="button"
                    >
                      {actionLoading ? "Salvo..." : "Salva nuovo orario"}
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="calendar-hud-footer">
              {isAdmin && selectedEvent.extendedProps.stato === "IN_ATTESA" && (
                <button
                  onClick={handleConfirmPending}
                  disabled={actionLoading}
                  className="calendar-hud-action-confirm disabled:opacity-50"
                  type="button"
                >
                  Conferma appuntamento
                </button>
              )}
              {isAdmin && selectedEvent.extendedProps.stato === "CONFERMATO" && (
                <button
                  onClick={handleSetPresente}
                  disabled={actionLoading}
                  className="calendar-hud-secondary-btn disabled:opacity-50"
                  type="button"
                >
                  Segna presente
                </button>
              )}
              {canEdit && (
                <button
                  onClick={handleCancel}
                  disabled={actionLoading}
                  className="calendar-hud-danger-btn disabled:opacity-50"
                  type="button"
                >
                  Cancella lezione
                </button>
              )}
              <button
                onClick={() => { setSelectedEvent(null); setNewSlotId(""); setShowReschedule(false); }}
                className="calendar-hud-neutral-btn"
                type="button"
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
