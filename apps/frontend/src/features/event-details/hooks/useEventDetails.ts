import { useCallback, useEffect, useState } from "react";

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

export function useEventDetails(
  idEvento: number | null,
): UseEventDetailsResult {
  const [state, setState] = useState<EventDetailsState>({
    idEvento: null,
    event: null,
    status: "loading",
    error: null,
  });

  const [retryCount, setRetryCount] = useState(0);

  const retry = useCallback(() => {
    setRetryCount((current) => current + 1);
  }, []);

  useEffect(() => {
    if (
      idEvento === null ||
      !Number.isSafeInteger(idEvento) ||
      idEvento <= 0
    ) {
      return;
    }

    const controller = new AbortController();

    setState({
      idEvento,
      event: null,
      status: "loading",
      error: null,
    });

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
  }, [idEvento, retryCount]);

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