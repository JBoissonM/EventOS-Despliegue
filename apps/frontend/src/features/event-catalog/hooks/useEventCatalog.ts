import { useCallback, useEffect, useState } from "react";

import { eventCatalogService } from "../services/eventCatalog.service";
import type { CatalogEventApi } from "../types/eventCatalog.types";

type CatalogStatus = "loading" | "success" | "error";

interface CatalogState {
  events: CatalogEventApi[];
  status: CatalogStatus;
  error: string | null;
}

export function useEventCatalog() {
  const [retryCount, setRetryCount] = useState(0);
  const [state, setState] = useState<CatalogState>({
    events: [],
    status: "loading",
    error: null,
  });

  const retry = useCallback(() => {
    setRetryCount((current) => current + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setState({ events: [], status: "loading", error: null });

    void eventCatalogService
      .getEvents(controller.signal)
      .then((events) => {
        if (controller.signal.aborted) return;
        setState({
          events: Array.isArray(events) ? events : [],
          status: "success",
          error: null,
        });
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setState({
          events: [],
          status: "error",
          error: "No se pudo cargar la cartelera. Comprueba tu conexión e inténtalo de nuevo.",
        });
      });

    return () => controller.abort();
  }, [retryCount]);

  return { ...state, retry };
}
