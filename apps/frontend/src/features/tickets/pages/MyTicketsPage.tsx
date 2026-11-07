import { useMemo, useState } from "react";
import { Link } from "react-router";
import { ArrowLeft, RotateCcw, Search } from "lucide-react";
import { Button } from "../../../components/atoms/Button/Button";
import { ConfirmationDialog } from "../../../components/organisms/ConfirmationDialog/ConfirmationDialog";
import { ApiError } from "../../../lib/apiClient";
import { TicketCard } from "../components/molecules/TicketCard";
import type { TicketCardProps, TicketStatus } from "../components/molecules/TicketCard";

export interface TicketItem extends Omit<TicketCardProps, "onViewQr" | "onViewDetails" | "onCancel"> {
  id: string;
  dateIso?: string;
  speakers?: string[];
}

export interface MyTicketsPageProps {
  tickets: TicketItem[];
  onCancelTicket: (ticketId: string) => Promise<void>;
  onViewQr: (ticketId: string) => void;
}

const normalize = (value: string) =>
  value.toLocaleLowerCase("es").normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const statuses: { value: TicketStatus; label: string }[] = [
  { value: "active", label: "Activo" },
  { value: "checked-in", label: "Ingresado" },
  { value: "cancelled", label: "Cancelado" },
];

const selectStyle = "min-h-11 w-full min-w-0 rounded-lg border border-eventos-panel-border bg-eventos-surface px-3 py-2 text-sm text-eventos-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-eventos-primary";

export function MyTicketsPage({ tickets, onCancelTicket, onViewQr }: MyTicketsPageProps) {
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [period, setPeriod] = useState("");
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");
  const [venue, setVenue] = useState("");
  const [status, setStatus] = useState("");
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const venueOptions = useMemo(
    () => Array.from(new Set(tickets.map((ticket) => ticket.venue).filter(Boolean))).sort((a, b) => a.localeCompare(b, "es")),
    [tickets],
  );

  const filteredTickets = useMemo(() => {
    const normalizedSearch = normalize(search.trim());
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const currentMonth = today.slice(0, 7);
    const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const nextMonth = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, "0")}`;

    return tickets.filter((ticket) => {
      const searchable = normalize([ticket.eventName, ticket.subEventName ?? ""].join(" "));
      const dateIso = ticket.dateIso ?? "";
      const matchesPeriod = period === ""
        || (period === "upcoming" && (dateIso > today || (dateIso === today && ticket.startTime >= currentTime)))
        || (period === "current-month" && dateIso.slice(0, 7) === currentMonth)
        || (period === "next-month" && dateIso.slice(0, 7) === nextMonth)
        || (period === "custom" && Boolean(dateIso) && (!rangeStart || dateIso >= rangeStart) && (!rangeEnd || dateIso <= rangeEnd));

      return (!normalizedSearch || searchable.includes(normalizedSearch))
        && matchesPeriod
        && (!venue || ticket.venue === venue)
        && (!status || ticket.status === status);
    });
  }, [tickets, search, period, rangeStart, rangeEnd, venue, status]);

  const selectedTicket = tickets.find((ticket) => ticket.id === selectedTicketId);
  const hasFilters = Boolean(search || period || venue || status);

  const clearFilters = () => {
    setSearch("");
    setPeriod("");
    setRangeStart("");
    setRangeEnd("");
    setVenue("");
    setStatus("");
  };

  const confirmCancel = async () => {
    if (!selectedTicket || selectedTicket.status !== "active" || isCancelling) return;
    setIsCancelling(true);
    setCancelError(null);
    setSuccessMessage(null);
    try {
      await onCancelTicket(selectedTicket.id);
      setSelectedTicketId(null);
      setSuccessMessage("Tu asistencia se canceló correctamente.");
    } catch (cause: unknown) {
      setCancelError(cause instanceof ApiError ? cause.message : "No fue posible cancelar tu asistencia. Intenta nuevamente.");
      setSelectedTicketId(null);
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-7xl space-y-7 font-merriweather">
      <Link to="/menu-asistente" className="inline-flex items-center gap-2 font-semibold text-eventos-primary hover:underline focus-visible:outline-2 focus-visible:outline-eventos-primary">
        <ArrowLeft size={19} aria-hidden="true" /> Volver
      </Link>

      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="shrink-0">
          <h1 className="text-3xl font-bold text-eventos-ink">Mis Boletos</h1>
          <p className="mt-2 text-sm text-eventos-muted-text">Consulta tus reservas y administra tu asistencia.</p>
        </div>
        <div className="w-full space-y-3 xl:max-w-5xl">
          <div className="flex gap-2">
            <label className="relative block min-w-0 flex-1">
              <span className="sr-only">Buscar evento o actividad</span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar evento o actividad..."
                className={`${selectStyle} pr-10`}
              />
              <Search size={19} className="pointer-events-none absolute right-3 top-3 text-secondary" aria-hidden="true" />
            </label>
            <button
              type="button"
              onClick={() => setFiltersOpen((value) => !value)}
              aria-expanded={filtersOpen}
              aria-controls="ticket-filter-controls"
              className="shrink-0 rounded-lg border border-eventos-primary px-3 text-sm font-semibold text-eventos-primary md:hidden"
            >
              Filtros{hasFilters ? " •" : ""}
            </button>
          </div>
          <div id="ticket-filter-controls" className={`${filtersOpen ? "grid" : "hidden"} grid-cols-2 gap-2 md:grid md:grid-cols-3`}>
            <label>
              <span className="sr-only">Filtrar por periodo</span>
              <select value={period} onChange={(event) => setPeriod(event.target.value)} className={selectStyle}>
                <option value="">Todas las fechas</option>
                <option value="upcoming">Próximas actividades</option>
                <option value="current-month">Este mes</option>
                <option value="next-month">Próximo mes</option>
                <option value="custom">Rango personalizado</option>
              </select>
            </label>
            <label>
              <span className="sr-only">Filtrar por espacio</span>
              <select value={venue} onChange={(event) => setVenue(event.target.value)} className={selectStyle}>
                <option value="">Todos los espacios</option>
                {venueOptions.map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </label>
            <label>
              <span className="sr-only">Filtrar por estado</span>
              <select value={status} onChange={(event) => setStatus(event.target.value)} className={selectStyle}>
                <option value="">Todos los estados</option>
                {statuses.map((value) => <option key={value.value} value={value.value}>{value.label}</option>)}
              </select>
            </label>
            {period === "custom" && (
              <div className="col-span-2 grid grid-cols-1 gap-2 rounded-lg border border-eventos-panel-border bg-eventos-panel-surface p-3 sm:grid-cols-2 md:col-span-3">
                <label className="space-y-1">
                  <span className="text-xs font-semibold text-eventos-ink">Desde</span>
                  <input
                    type="date"
                    value={rangeStart}
                    max={rangeEnd || undefined}
                    onChange={(event) => setRangeStart(event.target.value)}
                    className={selectStyle}
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-semibold text-eventos-ink">Hasta</span>
                  <input
                    type="date"
                    value={rangeEnd}
                    min={rangeStart || undefined}
                    onChange={(event) => setRangeEnd(event.target.value)}
                    className={selectStyle}
                  />
                </label>
              </div>
            )}
          </div>
        </div>
      </div>

      {hasFilters && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-eventos-muted-text">
          <span>{filteredTickets.length} de {tickets.length} boletos</span>
          <button type="button" onClick={clearFilters} className="inline-flex items-center gap-2 font-semibold text-eventos-primary hover:underline">
            <RotateCcw size={16} aria-hidden="true" /> Limpiar filtros
          </button>
        </div>
      )}

      {cancelError && <p role="alert" className="rounded-lg border border-eventos-error p-3 text-sm text-eventos-error">{cancelError}</p>}
      {successMessage && <p role="status" className="rounded-lg border border-eventos-success p-3 text-sm text-eventos-success">{successMessage}</p>}

      {filteredTickets.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredTickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              {...ticket}
              onViewQr={ticket.status === "active" ? () => onViewQr(ticket.id) : undefined}
              onViewDetails={ticket.status !== "active" ? () => onViewQr(ticket.id) : undefined}
              onCancel={ticket.status === "active" ? () => {
                setCancelError(null);
                setSuccessMessage(null);
                setSelectedTicketId(ticket.id);
              } : undefined}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-eventos-panel-border bg-eventos-surface px-5 py-12 text-center">
          <h2 className="text-lg font-semibold text-eventos-ink">
            {tickets.length === 0 ? "No cuentas con eventos registrados" : "No se encontraron registros que coincidan con los filtros seleccionados"}
          </h2>
          <p className="mt-2 text-sm text-eventos-muted-text">
            {tickets.length === 0 ? "Explora la cartelera para reservar tu lugar." : "Modifica los filtros para consultar otros boletos."}
          </p>
          {tickets.length > 0 && hasFilters && <div className="mt-4"><Button text="Limpiar filtros" variant="outline" onClick={clearFilters} /></div>}
          {tickets.length === 0 && <Link to="/asistente/cartelera" className="mt-4 inline-block font-semibold text-eventos-primary underline">Ver cartelera</Link>}
        </div>
      )}

      <ConfirmationDialog
        isOpen={Boolean(selectedTicket)}
        title="Cancelar asistencia"
        description={`¿Estás seguro de que deseas cancelar tu asistencia a ${selectedTicket?.subEventName ?? selectedTicket?.eventName ?? "esta actividad"}? Esta acción liberará tu lugar.`}
        confirmText="Confirmar cancelación"
        cancelText="Volver"
        variant="danger"
        isLoading={isCancelling}
        onConfirm={() => void confirmCancel()}
        onCancel={() => { if (!isCancelling) setSelectedTicketId(null); }}
      />
    </section>
  );
}

export default MyTicketsPage;
