import { Link, useNavigate } from "react-router";
import { useMemo } from "react";
import { MyTicketsPage } from "../tickets/pages/MyTicketsPage";
import { useMyTickets } from "../tickets/hooks/useMyTickets";
import { ticketsService } from "../tickets/services/tickets.service";
import { mapTicketToCard } from "../tickets/utils/mapTicketToCard";
import { CatalogEventCard } from "../event-catalog/components/CatalogEventCard";
import { useEventCatalog } from "../event-catalog/hooks/useEventCatalog";
import { getEventDates } from "../event-catalog/utils/catalogFilters";

export function MenuAsistente() {
  const navigate = useNavigate();
  const { events, status, error, retry } = useEventCatalog();
  const agenda = useMyTickets();
  const agendaItems = useMemo(() => agenda.tickets.map(mapTicketToCard), [agenda.tickets]);

  const cancelTicket = async (ticketId: string) => {
    await ticketsService.cancelTicket(Number(ticketId));
    agenda.refresh();
  };
  const eventosProximos = [...events]
    .sort((first, second) =>
      (getEventDates(first)[0] ?? "9999-12-31").localeCompare(
        getEventDates(second)[0] ?? "9999-12-31",
      ),
    )
    .slice(0, 3);

  return (
    <div className="space-y-10 font-merriweather text-eventos-body-text">
      <section>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-eventos-ink">Eventos Próximos</h2>
          <Link
            to="/asistente/cartelera"
            className="text-sm font-semibold text-eventos-primary underline-offset-4 hover:underline"
          >
            Ver cartelera completa
          </Link>
        </div>

        {status === "loading" && (
          <p role="status" className="py-8 text-center text-eventos-muted-text">
            Cargando eventos próximos...
          </p>
        )}

        {status === "error" && (
          <div role="alert" className="flex flex-col items-center gap-3 rounded-md border border-eventos-divider p-8 text-center">
            <p>{error}</p>
            <button
              type="button"
              onClick={retry}
              className="rounded-md bg-eventos-primary px-4 py-2 text-sm font-semibold text-eventos-on-primary hover:bg-eventos-action-hover"
            >
              Reintentar
            </button>
          </div>
        )}

        {status === "success" && eventosProximos.length > 0 && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {eventosProximos.map((evento) => (
              <CatalogEventCard key={evento.idEvento} event={evento} headingLevel="h3" />
            ))}
          </div>
        )}

        {status === "success" && eventosProximos.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-eventos-divider bg-eventos-on-primary py-12">
            <p className="text-lg font-bold text-eventos-ink">Sin eventos próximos</p>
            <Link to="/asistente/cartelera" className="mt-3 text-sm text-eventos-primary underline-offset-4 hover:underline">
              Ir a la cartelera
            </Link>
          </div>
        )}
      </section>

      <section className="space-y-5 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-eventos-ink">Mi Agenda</h2>
          <Link to="/asistente/boletos" className="text-sm font-semibold text-eventos-primary underline-offset-4 hover:underline">
            Ver mis boletos
          </Link>
        </div>

        {agenda.status === "loading" && (
          <p role="status" className="py-8 text-center text-eventos-muted-text">Cargando tu agenda...</p>
        )}

        {agenda.status === "error" && (
          <div role="alert" className="space-y-3 rounded-md border border-eventos-divider p-6 text-center">
            <p>{agenda.error}</p>
            <button type="button" onClick={agenda.refresh} className="rounded-md bg-eventos-primary px-4 py-2 text-eventos-on-primary">Reintentar</button>
          </div>
        )}

        {agenda.status === "success" && (
          <MyTicketsPage
            variant="preview"
            tickets={agendaItems}
            onCancelTicket={cancelTicket}
            onViewQr={(id) => navigate(`/asistente/boletos/${id}`)}
          />
        )}
      </section>
    </div>
  );
}

export default MenuAsistente;
