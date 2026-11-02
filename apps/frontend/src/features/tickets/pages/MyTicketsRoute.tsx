import { useMemo } from "react";
import { Link, useNavigate } from "react-router";
import { MyTicketsPage } from "./MyTicketsPage";
import { useMyTickets } from "../hooks/useMyTickets";
import { ticketsService } from "../services/tickets.service";
import { mapTicketToCard } from "../utils/mapTicketToCard";

export function MyTicketsRoute() {
  const navigate = useNavigate();
  const { tickets, status, error, refresh } = useMyTickets();
  const items = useMemo(() => tickets.map(mapTicketToCard), [tickets]);

  const cancelTicket = async (ticketId: string) => {
    await ticketsService.cancelTicket(Number(ticketId));
    refresh();
  };

  if (status === "loading") {
    return <p role="status" className="py-12 text-center text-eventos-muted-text">Cargando tus boletos...</p>;
  }

  if (status === "error") {
    return (
      <div role="alert" className="mx-auto max-w-xl space-y-4 rounded-lg border border-eventos-divider p-8 text-center">
        <p>{error}</p>
        <div className="flex justify-center gap-4">
          <button type="button" onClick={refresh} className="rounded-md bg-eventos-primary px-4 py-2 text-eventos-on-primary">Reintentar</button>
          <Link to="/login" state={{ returnUrl: "/asistente/boletos" }} className="rounded-md border border-eventos-primary px-4 py-2 text-eventos-primary">Iniciar sesión</Link>
        </div>
      </div>
    );
  }

  return (
    <MyTicketsPage
      tickets={items}
      onCancelTicket={cancelTicket}
      onViewQr={(ticketId) => navigate(`/asistente/boletos/${ticketId}`)}
    />
  );
}
