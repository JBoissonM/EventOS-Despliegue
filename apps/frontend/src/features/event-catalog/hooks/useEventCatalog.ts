import { useCallback, useEffect, useRef, useState } from "react";

import { eventCatalogService } from "../services/eventCatalog.service";
import type { CatalogEventApi } from "../types/eventCatalog.types";

type CatalogStatus = "loading" | "success" | "error";

interface CatalogState {
  events: CatalogEventApi[];
  status: CatalogStatus;
  error: string | null;
  failedCount: number;
}

const AUTO_REFRESH_INTERVAL = 3 * 60 * 1000;
const MIN_REFRESH_INTERVAL = 2 * 60 * 1000;

export function useEventCatalog() {
  const [refreshKey, setRefreshKey] = useState(0);
  const lastRefreshAt = useRef(Date.now());

  const [state, setState] = useState<CatalogState>({
    events: [],
    status: "loading",
    error: null,
    failedCount: 0,
  });

  const retry = useCallback(() => {
    lastRefreshAt.current = Date.now();
    setRefreshKey((current) => current + 1);
  }, []);

  const refreshIfDue = useCallback(() => {
    if (document.visibilityState !== "visible") {
      return;
    }

    const now = Date.now();

    if (now - lastRefreshAt.current < MIN_REFRESH_INTERVAL) {
      return;
    }

    lastRefreshAt.current = now;
    setRefreshKey((current) => current + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    setState((current) =>
      current.status === "success"
        ? current
        : {
          events: [],
          status: "loading",
          error: null,
          failedCount: 0,
        },
    );

    void eventCatalogService
      .getEvents(controller.signal)
      .then(({ events, failedCount }) => {
        if (controller.signal.aborted) {
          return;
        }

        setState({
          events,
          status: "success",
          error: null,
          failedCount,
        });
      })
      .catch(() => {
        if (controller.signal.aborted) {
          return;
        }

        setState({
          events: [],
          status: "error",
          error:
            "No se pudo actualizar la cartelera. Comprueba tu conexión e inténtalo de nuevo.",
          failedCount: 0,
        });
      });

    return () => controller.abort();
  }, [refreshKey]);

  useEffect(() => {
    const handleFocus = () => {
      refreshIfDue();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshIfDue();
      }
    };

    const intervalId = window.setInterval(
      refreshIfDue,
      AUTO_REFRESH_INTERVAL,
    );

    window.addEventListener("focus", handleFocus);
    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange,
    );

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );
    };
  }, [refreshIfDue]);

  return { ...state, retry };
}