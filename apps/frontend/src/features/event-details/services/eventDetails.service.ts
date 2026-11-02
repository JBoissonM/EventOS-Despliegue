import { apiRequest } from "../../../lib/apiClient";

import type {
  EventDetailsApi,
} from "../types/eventDetails.api.types";

function validateEventId(idEvento: number): void {
  if (!Number.isSafeInteger(idEvento) || idEvento <= 0) {
    throw new Error("El identificador del evento no es válido.");
  }
}

export const eventDetailsService = {
  getById(
    idEvento: number,
    signal?: AbortSignal,
  ): Promise<EventDetailsApi> {
    validateEventId(idEvento);

    return apiRequest<EventDetailsApi>(
      `eventos/${idEvento}`,
      { signal },
    );
  },
};