import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { ConfirmationDialog } from "../../../components/organisms/ConfirmationDialog/ConfirmationDialog";
import { TicketCard } from "../components/molecules/TicketCard";
import type { TicketCardProps, TicketStatus } from "../components/molecules/TicketCard";

export type TicketItem = Omit<
  TicketCardProps,
  "onViewQr" | "onCancel" | "onViewDetails"
> & {
  id: string;
  eventDateKey?: string;
  speakers?: string[];
};

export interface MyTicketsPageProps {
  tickets: TicketItem[];
  onCancelTicket: (ticketId: string) => Promise<void>;
  onViewQr?: (ticketId: string) => void;
  variant?: "page" | "preview";
}

const filterClassName =
  "h-11 w-full min-w-0 rounded-md border border-eventos-divider-strong bg-eventos-on-primary px-3 text-sm text-eventos-body-text focus-visible:outline-2 focus-visible:outline-eventos-secondary";

const statusPriority: Record<TicketStatus, number> = {
  active: 0,
  "checked-in": 1,
  expired: 2,
  cancelled: 3,
};

function normalize(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function sortTickets(a: TicketItem, b: TicketItem): number {
  const priority = statusPriority[a.status] - statusPriority[b.status];
  if (priority !== 0) return priority;

  const dateA = a.eventDateKey ?? "";
  const dateB = b.eventDateKey ?? "";
  if (dateA !== dateB) {
    return a.status === "active"
      ? dateA.localeCompare(dateB)
      : dateB.localeCompare(dateA);
  }

  return Number(b.id) - Number(a.id);
}

export function MyTicketsPage({
  tickets,
  onCancelTicket,
  onViewQr,
  variant = "page",
}: MyTicketsPageProps) {
  const [search, setSearch] = useState("");
  const [date, setDate] = useState("");
  const [venue, setVenue] = useState("");
  const [speaker, setSpeaker] = useState("");
  const [ticketStatus, setTicketStatus] = useState("");
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedTicket = tickets.find((ticket) => ticket.id === selectedTicketId);

  const dates = useMemo(
    () => [...new Map<string, string>(
      tickets
        .filter((ticket) => ticket.eventDateKey)
        .map((ticket): [string, string] => [ticket.eventDateKey!, ticket.date]),
    )].sort(([a], [b]) => a.localeCompare(b)),
    [tickets],
  );

  const venues = useMemo(
    () => [...new Set(tickets.map((ticket) => ticket.venue))].sort((a, b) => a.localeCompare(b, "es")),
    [tickets],
  );

  const speakers = useMemo(
    () => [...new Set(tickets.flatMap((ticket) => ticket.speakers ?? []))]
      .sort((a, b) => a.localeCompare(b, "es")),
    [tickets],
  );

  const visibleTickets = useMemo(() => {
    const query = normalize(search);
    const filtered = tickets.filter((ticket) => {
      if (variant === "preview" && ticket.status !== "active") return false;
      if (date && ticket.eventDateKey !== date) return false;
      if (venue && ticket.venue !== venue) return false;
      if (speaker && !(ticket.speakers ?? []).includes(speaker)) return false;
      if (ticketStatus && ticket.status !== ticketStatus) return false;

      const searchableText = [
        ticket.eventName,
        ticket.subEventName ?? "",
        ticket.venue,
        ...(ticket.speakers ?? []),
      ].join(" ");

      return normalize(searchableText).includes(query);
    });

    filtered.sort(sortTickets);
    return variant === "preview" ? filtered.slice(0, 3) : filtered;
  }, [tickets, search, date, venue, speaker, ticketStatus, variant]);

  const hasFilters = Boolean(search.trim() || date || venue || speaker || ticketStatus);

  const clearFilters = () => {
    setSearch("");
    setDate("");
    setVenue("");
    setSpeaker("");
    setTicketStatus("");
  };

  const handleConfirmCancel = async () => {
    if (!selectedTicket || selectedTicket.status !== "active" || isCancelling) return;

    setIsCancelling(true);
    setError(null);

    try {
      await onCancelTicket(selectedTicket.id);
      setSelectedTicketId(null);
    } catch {
      setError("No fue posible cancelar la asistencia. Inténtalo nuevamente.");
      setSelectedTicketId(null);
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-6xl space-y-6">
      {variant === "page" && (
        <div className="space-y-5">
          <h1 className="font-merriweather text-3xl font-bold">Mis Boletos</h1>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
            <label className="relative col-span-2 lg:col-span-2">
              <span className="sr-only">Buscar evento o ponente</span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar evento o ponente..."
                className={`${filterClassName} pr-10`}
              />
              <Search size={18} aria-hidden="true" className="pointer-events-none absolute right-3 top-3 text-eventos-muted-text" />
            </label>

            <label className="min-w-0">
              <span className="sr-only">Filtrar por fecha</span>
              <select value={date} onChange={(event) => setDate(event.target.value)} className={filterClassName}>
                <option value="">Fecha</option>
                {dates.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
              </select>
            </label>

            <label className="min-w-0">
              <span className="sr-only">Filtrar por espacio</span>
              <select value={venue} onChange={(event) => setVenue(event.target.value)} className={filterClassName}>
                <option value="">Espacio</option>
                {venues.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
            </label>

            <label className="min-w-0">
              <span className="sr-only">Filtrar por ponente</span>
              <select value={speaker} onChange={(event) => setSpeaker(event.target.value)} className={filterClassName} disabled={speakers.length === 0}>
                <option value="">Ponente{speakers.length === 0 ? " (sin datos)" : ""}</option>
                {speakers.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
            </label>

            <label className="min-w-0">
              <span className="sr-only">Filtrar por estado</span>
              <select value={ticketStatus} onChange={(event) => setTicketStatus(event.target.value)} className={filterClassName}>
                <option value="">Estado</option>
                <option value="active">Activo</option>
                <option value="checked-in">Ingresado</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </label>
          </div>

          <div className="flex items-center justify-between gap-3 text-sm text-eventos-muted-text">
            <p role="status" aria-live="polite">
              {visibleTickets.length} de {tickets.length} boletos
            </p>
            {hasFilters && (
              <button type="button" onClick={clearFilters} className="font-semibold text-eventos-primary hover:underline">
                Limpiar filtros
              </button>
            )}
          </div>
        </div>
      )}

      {error && <p role="alert" className="text-sm text-eventos-error">{error}</p>}

      {visibleTickets.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {visibleTickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              eventName={ticket.eventName}
              subEventName={ticket.subEventName}
              date={ticket.date}
              startTime={ticket.startTime}
              endTime={ticket.endTime}
              venue={ticket.venue}
              status={ticket.status}
              visibility={ticket.visibility}
              posterUrl={ticket.posterUrl}
              hasQr={ticket.hasQr}
              onViewQr={ticket.status === "active" && onViewQr ? () => onViewQr(ticket.id) : undefined}
              onViewDetails={ticket.status !== "active" && onViewQr ? () => onViewQr(ticket.id) : undefined}
              onCancel={ticket.status === "active" ? () => {
                setSelectedTicketId(ticket.id);
                setError(null);
              } : undefined}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-eventos-neutral p-10 text-center">
          <p className="font-semibold">
            {variant === "preview"
              ? "No tienes reservaciones activas."
              : tickets.length === 0
                ? "Todavía no tienes boletos."
                : "No se encontraron boletos."}
          </p>
          <p className="mt-2 text-sm text-eventos-muted-text">
            {tickets.length === 0
              ? "Cuando reserves un lugar, podrás consultar aquí tu boleto."
              : "Prueba con otros filtros o limpia la búsqueda."}
          </p>
          {variant === "page" && hasFilters && (
            <button type="button" onClick={clearFilters} className="mt-4 rounded-md border border-eventos-primary px-4 py-2 font-semibold text-eventos-primary">
              Limpiar filtros
            </button>
          )}
        </div>
      )}

      <ConfirmationDialog
        isOpen={Boolean(selectedTicket)}
        title="Cancelar asistencia"
        description={`¿Estás seguro de que deseas cancelar tu asistencia al evento ${selectedTicket?.eventName ?? ""}?`}
        confirmText="Confirmar cancelación"
        cancelText="Volver"
        variant="danger"
        isLoading={isCancelling}
        onConfirm={handleConfirmCancel}
        onCancel={() => setSelectedTicketId(null)}
      />
    </section>
  );
}

export default MyTicketsPage;
