import { AlcanceEvento } from "@eventos/shared";
import { formatEventDate } from "../../event-details/utils/formatEventDate";
import { mapTicketStatus } from "./mapTicketsStatus";
import type { TicketSummaryResponse } from "../services/tickets.service";
import type { TicketItem } from "../pages/MyTicketsPage";

export function mapTicketToCard(ticket: TicketSummaryResponse): TicketItem {
  const visibility =
    ticket.idAlcance === AlcanceEvento.PRIVADO
      ? "private"
      : ticket.idAlcance === AlcanceEvento.INTERNO
        ? "internal"
        : "public";

  return {
    id: String(ticket.idBoleto),
    eventName: ticket.nombreEvento || "Evento sin nombre",
    subEventName: ticket.nombreSubEvento || undefined,
    date: formatEventDate(ticket.fecha),
    eventDateKey: ticket.fecha.slice(0, 10),
    speakers: ticket.ponentes ?? [],
    startTime: ticket.horaInicio.slice(0, 5),
    endTime: ticket.horaFin.slice(0, 5),
    venue: ticket.recinto || "Recinto por confirmar",
    status: mapTicketStatus(ticket.estadoBoleto),
    visibility,
    posterUrl: ticket.poster || undefined,
    hasQr: ticket.accesoQR !== false,
  };
}
