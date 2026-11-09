import { formatEventDate } from "../../event-details/utils/formatEventDate";
import type { TicketItem } from "../pages/MyTicketsPage";
import type { TicketSummaryResponse } from "../services/tickets.service";
import { mapTicketStatus } from "./mapTicketsStatus";

export function mapTicketToCard(ticket: TicketSummaryResponse): TicketItem {
  const alcance = ticket.alcance?.toLocaleLowerCase("es") ?? "";
  const visibility = alcance.includes("privad")
    ? "private"
    : alcance.includes("intern")
      ? "internal"
      : "public";

  return {
    id: String(ticket.idBoleto),
    eventName: ticket.nombreEvento || "Evento sin nombre",
    subEventName: ticket.nombreSubEvento || undefined,
    date: formatEventDate(ticket.fecha),
    dateIso: ticket.fecha?.slice(0, 10) ?? "",
    startTime: ticket.horaInicio?.slice(0, 5) ?? "--:--",
    endTime: ticket.horaFin?.slice(0, 5) ?? "--:--",
    venue: ticket.recinto || "Recinto por confirmar",
    speakers: (ticket.ponentes ?? []).map((speaker) => speaker.nombreCompleto),
    status: mapTicketStatus(ticket.estadoBoleto),
    visibility,
    posterUrl: (() => {
      const rawPoster = ticket.poster?.trim() ?? "";
      if (!rawPoster) return undefined;
      return /^https?:\/\//i.test(rawPoster)
        ? rawPoster
        : `http://localhost:9000/eventos-public/${rawPoster.replace(/^\/+/, "")}`;
    })(),
  };
}
