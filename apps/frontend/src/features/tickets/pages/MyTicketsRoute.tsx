import { useMemo } from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "../../../components/atoms/Button/Button";
import { useMyTickets } from "../hooks/useMyTickets";
import { ticketsService } from "../services/tickets.service";
import { mapTicketToCard } from "../utils/mapTicketToCard";
import { MyTicketsPage } from "./MyTicketsPage";

export function MyTicketsRoute() {
  const navigate = useNavigate();
  const { tickets, status, error, errorStatus, refresh } = useMyTickets();
  const items = useMemo(() => {
    const priority = { active: 0, "checked-in": 1, cancelled: 2 };
    return tickets.map(mapTicketToCard).sort((a, b) => {
      const difference = priority[a.status] - priority[b.status];
      if (difference !== 0) return difference;
      const dateA = `${a.dateIso ?? ""}T${a.startTime}`;
      const dateB = `${b.dateIso ?? ""}T${b.startTime}`;
      return a.status === "active"
        ? dateA.localeCompare(dateB)
        : dateB.localeCompare(dateA);
    });
  }, [tickets]);

  const cancelTicket = async (id: string) => {
    await ticketsService.cancelTicket(Number(id));
    refresh();
  };

  if (status === "loading") {
    return <p role="status" className="mx-auto max-w-6xl py-16 text-center text-eventos-muted-text">Cargando tus boletos...</p>;
  }

  if (status === "error") {
    const requiereLogin =
      errorStatus === 401 ||
      (errorStatus === 403 && !localStorage.getItem("token"));
    return (
      <div className="mx-auto max-w-xl space-y-5 rounded-xl border border-eventos-panel-border bg-eventos-surface p-8 text-center">
        <p role="alert" className="text-eventos-error">{error}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button text="Reintentar" onClick={refresh} />
          {requiereLogin ? (
            <Link to="/login" className="rounded-lg border border-eventos-primary px-4 py-2 font-semibold text-eventos-primary">Iniciar sesión</Link>
          ) : (
            <Link to="/menu-asistente" className="rounded-lg border border-eventos-primary px-4 py-2 font-semibold text-eventos-primary">Volver al menú</Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <MyTicketsPage
      tickets={items}
      onCancelTicket={cancelTicket}
      onViewQr={(id) => navigate(`/asistente/boletos/${id}`)}
    />
  );
}
