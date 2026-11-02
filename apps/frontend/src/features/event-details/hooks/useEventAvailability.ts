import { useReservationAvailability } from "../../reservations/hooks/useReservationAvailability";

import { withAvailability } from "../adapters/eventDetails.adapter";

import type {
  AvailabilityStatus,
  EventActivityViewModel,
} from "../types/eventDetails.types";

export interface UseEventAvailabilityResult {
  activity: EventActivityViewModel | null;
  status: AvailabilityStatus;
  error: string | null;
  refresh: () => void;
}

export function useEventAvailability(
  activity: EventActivityViewModel | null,
): UseEventAvailabilityResult {
  const idSubEvento =
    activity &&
    Number.isSafeInteger(activity.idSubEvento) &&
    activity.idSubEvento > 0
      ? activity.idSubEvento
      : null;

  const {
    availability,
    isLoading,
    error,
    refresh,
  } = useReservationAvailability(idSubEvento);

  const currentAvailability =
    activity &&
    availability?.idSubEvento === activity.idSubEvento
      ? availability
      : null;

  let status: AvailabilityStatus;

  if (activity === null) {
    status = "pendiente";
  } else if (idSubEvento === null) {
    status = "error";
  } else if (isLoading) {
    status = "cargando";
  } else if (error !== null) {
    status = "error";
  } else if (currentAvailability !== null) {
    status = "lista";
  } else {
    status = "cargando";
  }

  const updatedActivity: EventActivityViewModel | null =
    activity === null
      ? null
      : status === "lista" && currentAvailability
        ? withAvailability(activity, currentAvailability)
        : {
          ...activity,
          disponibilidad: {
            estado: status,
            lugaresDisponibles: null,
            permiteReservar: null,
          },
        };

  const currentError =
    activity === null
      ? null
      : idSubEvento === null
        ? "El identificador de la actividad no es válido."
        : status === "error"
          ? error
          : null;

  return {
    activity: updatedActivity,
    status,
    error: currentError,
    refresh,
  };
}