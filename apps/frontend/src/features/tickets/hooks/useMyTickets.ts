import { useCallback, useEffect, useState } from "react";
import { ApiError } from "../../../lib/apiClient";
import { ticketsService } from "../services/tickets.service";
import type { TicketSummaryResponse } from "../services/tickets.service";

type RequestStatus = "loading" | "success" | "error";

export function useMyTickets() {
  const [tickets, setTickets] = useState<TicketSummaryResponse[]>([]);
  const [status, setStatus] = useState<RequestStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);

  const refresh = useCallback(() => setRequestVersion((value) => value + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    setStatus((current) => current === "success" ? current : "loading");
    setError(null);
    setErrorStatus(null);

    void ticketsService.getMyTickets(controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;
        setTickets(Array.isArray(data) ? data : []);
        setErrorStatus(null);
        setStatus("success");
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setErrorStatus(cause instanceof ApiError ? cause.status : null);
        const sinToken = !localStorage.getItem("token");

        const requiereLogin =
          cause instanceof ApiError &&
          (cause.status === 401 || (cause.status === 403 && sinToken));
          setError(
            requiereLogin
              ? "Tu sesión no está disponible o no es válida. Inicia sesión para consultar tus boletos."
              : cause instanceof ApiError && cause.status === 403
                ? "Tu cuenta no tiene permisos para consultar estos boletos."
                : "No fue posible consultar tus boletos. Intenta nuevamente.",
          );
        setStatus("error");
      });

    return () => controller.abort();
  }, [requestVersion]);

  return { tickets, status, error, errorStatus, refresh };
}
