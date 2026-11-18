import { useCallback, useEffect, useRef, useState } from "react";
import type { ReservationAvailability } from "../services/reservations.service";
import { reservationsService } from "../services/reservations.service";

export function useReservationAvailability(
  idSubEvento: number | null,
  autoRefreshMs = 0,
) {
  const [availability, setAvailability] =
    useState<ReservationAvailability | null>(null);

  const availabilityRef = useRef<ReservationAvailability | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => {
    setRefreshKey((current) => current + 1);
  }, []);

  useEffect(() => {
    if (idSubEvento === null) {
      availabilityRef.current = null;
      setAvailability(null);
      setError("El identificador del subevento no es válido.");
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    const controller = new AbortController();

    const hasCurrentAvailability =
      availabilityRef.current?.idSubEvento === idSubEvento;

    if (hasCurrentAvailability) {
      setIsLoading(false);
      setIsRefreshing(true);
    } else {
      availabilityRef.current = null;
      setAvailability(null);
      setIsLoading(true);
      setIsRefreshing(false);
    }

    setError(null);

    void reservationsService
      .getAvailability(idSubEvento, controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;

        availabilityRef.current = data;
        setAvailability(data);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;

        setError(
          cause instanceof Error
            ? cause.message
            : "No se pudo consultar la disponibilidad.",
        );
      })
      .finally(() => {
        if (controller.signal.aborted) return;

        setIsLoading(false);
        setIsRefreshing(false);
      });

    return () => {
      controller.abort();
    };
  }, [idSubEvento, refreshKey]);

  useEffect(() => {
    if (idSubEvento === null || autoRefreshMs <= 0) return;

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        refresh();
      }
    }, autoRefreshMs);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refresh();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );
    };
  }, [idSubEvento, autoRefreshMs, refresh]);

  return {
    availability:
      availability?.idSubEvento === idSubEvento ? availability : null,
    isLoading,
    isRefreshing,
    error,
    refresh,
  };
}