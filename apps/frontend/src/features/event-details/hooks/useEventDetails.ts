import { useCallback, useEffect, useRef, useState } from "react";

import { ApiError } from "../../../lib/apiClient";
import { toEventDetailsViewModel } from "../adapters/eventDetails.adapter";
import { eventDetailsService } from "../services/eventDetails.service";

import type { EventDetailsViewModel } from "../types/eventDetails.types";

export type EventDetailsLoadStatus =
  | "loading"
  | "success"
  | "not-found"
  | "forbidden"
  | "invalid"
  | "error";

interface EventDetailsState {
  idEvento: number | null;
  event: EventDetailsViewModel | null;
  status: EventDetailsLoadStatus;
  error: string | null;
}

export interface UseEventDetailsResult {
  event: EventDetailsViewModel | null;
  status: EventDetailsLoadStatus;
  error: string | null;
  retry: () => void;
}

const AUTO_REFRESH_INTERVAL = 3 * 60 * 1000;
const MIN_REFRESH_INTERVAL = 2 * 60 * 1000;

export function useEventDetails(
  idEvento: number | null,
): UseEventDetailsResult {
  const [state, setState] = useState<EventDetailsState>({
    idEvento: null,
    event: null,
    status: "loading",
    error: null,
  });

  const [refreshKey, setRefreshKey] = useState(0);
  const lastRefreshAt = useRef(Date.now());

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
    lastRefreshAt.current = Date.now();
  }, [idEvento]);

  useEffect(() => {
    if (
      idEvento === null ||
      !Number.isSafeInteger(idEvento) ||
      idEvento <= 0
    ) {
      return;
    }

    const controller = new AbortController();

    setState((current) =>
      current.idEvento === idEvento && current.status === "success"
        ? current
        : {
          idEvento,
          event: null,
          status: "loading",
          error: null,
        },
    );

    void eventDetailsService
      .getById(idEvento, controller.signal)
      .then(toEventDetailsViewModel)
      .then((event) => {
        if (controller.signal.aborted) return;

        setState({
          idEvento,
          event,
          status: "success",
          error: null,
        });
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;

        let status: EventDetailsLoadStatus = "error";
        let error = "No fue posible cargar el evento.";

        if (cause instanceof ApiError) {
          error = cause.message;

          if (cause.status === 404) {
            status = "not-found";
          } else if (
            cause.status === 401 ||
            cause.status === 403
          ) {
            status = "forbidden";
          }
        }

        setState({
          idEvento,
          event: null,
          status,
          error,
        });
      });

    return () => {
      controller.abort();
    };
  }, [idEvento, refreshKey]);

  useEffect(() => {
    const validId =
      idEvento !== null &&
      Number.isSafeInteger(idEvento) &&
      idEvento > 0;

    if (!validId) {
      return;
    }

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
  }, [idEvento, refreshIfDue]);

  const invalidId =
    idEvento === null ||
    !Number.isSafeInteger(idEvento) ||
    idEvento <= 0;

  if (invalidId) {
    return {
      event: null,
      status: "invalid",
      error: "El identificador del evento no es válido.",
      retry,
    };
  }

  if (state.idEvento !== idEvento) {
    return {
      event: null,
      status: "loading",
      error: null,
      retry,
    };
  }

  return {
    event: state.event,
    status: state.status,
    error: state.error,
    retry,
  };
}