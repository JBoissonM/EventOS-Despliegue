import { useCallback, useEffect, useState } from "react";
import { ApiError } from "../../../lib/apiClient";
import { ticketsService } from "../services/tickets.service";
import type { TicketSummaryResponse } from "../services/tickets.service";

type TicketsStatus = "loading" | "success" | "error";

export function useMyTickets() {
  const [refreshCount, setRefreshCount] = useState(0);
  const [tickets, setTickets] = useState<TicketSummaryResponse[]>([]);
  const [status, setStatus] = useState<TicketsStatus>("loading");
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => setRefreshCount((count) => count + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");
    setError(null);

    void ticketsService.getMyTickets(controller.signal)
      .then((response) => {
        if (controller.signal.aborted) return;
        setTickets(Array.isArray(response) ? response : []);
        setStatus("success");
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        const sessionError = cause instanceof ApiError && (cause.status === 401 || cause.status === 403);
        setError(sessionError
          ? "Tu sesión no es válida. Inicia sesión nuevamente para consultar tus boletos."
          : "No pudimos consultar tus boletos. Inténtalo de nuevo.");
        setStatus("error");
      });

    return () => controller.abort();
  }, [refreshCount]);

  return { tickets, status, error, refresh };
}
