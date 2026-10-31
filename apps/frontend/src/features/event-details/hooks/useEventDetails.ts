import type {
  EventDetailsViewModel,
} from "../types/eventDetails.types";

import {
  useDetailsResource,
  type DetailsLoader,
} from "./useDetailsResource";

export type EventDetailsLoader =
  DetailsLoader<EventDetailsViewModel>;

export function useEventDetails(
  idEvento: number | null,
  loadEvent: EventDetailsLoader,
) {
  const {
    data,
    status,
    error,
    retry,
  } = useDetailsResource(
    idEvento,
    loadEvent,
  );

  return {
    event: data,
    status,
    error,
    retry,
  };
}