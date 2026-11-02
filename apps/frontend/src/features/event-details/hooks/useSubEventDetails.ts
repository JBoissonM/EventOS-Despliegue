import { getActivityById } from "../adapters/eventDetails.adapter";
import {
  useEventDetails,
  type EventDetailsLoadStatus,
} from "./useEventDetails";

import type {
  EventActivityViewModel,
  EventDetailsViewModel,
} from "../types/eventDetails.types";

export interface UseSubEventDetailsResult {
  event: EventDetailsViewModel | null;
  activity: EventActivityViewModel | null;
  status: EventDetailsLoadStatus;
  error: string | null;
  retry: () => void;
}

export function useSubEventDetails(
  idEvento: number | null,
  idSubEvento: number | null,
): UseSubEventDetailsResult {
  const validSubEventId =
    idSubEvento !== null &&
    Number.isSafeInteger(idSubEvento) &&
    idSubEvento > 0;

  const {
    event,
    status,
    error,
    retry,
  } = useEventDetails(
    validSubEventId ? idEvento : null,
  );

  if (!validSubEventId) {
    return {
      event: null,
      activity: null,
      status: "invalid",
      error: "El identificador de la actividad no es válido.",
      retry,
    };
  }

  if (status !== "success" || event === null) {
    return {
      event,
      activity: null,
      status,
      error,
      retry,
    };
  }

  const activity = getActivityById(
    event,
    idSubEvento,
  );

  if (activity === null) {
    return {
      event,
      activity: null,
      status: "not-found",
      error: "La actividad solicitada no existe en este evento.",
      retry,
    };
  }

  return {
    event,
    activity,
    status: "success",
    error: null,
    retry,
  };
}