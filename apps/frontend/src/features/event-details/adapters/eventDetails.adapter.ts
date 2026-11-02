import type {
  EventDetailsApi,
  EventAvailabilityApi,
  SubEventDetailsApi,
} from "../types/eventDetails.api.types";

import type {
  EventActivityViewModel,
  EventDetailsViewModel,
  EventSpeakerViewModel,
} from "../types/eventDetails.types";

function mapSpeaker(
  speaker: SubEventDetailsApi["ponentes"][number],
): EventSpeakerViewModel {
  const nombreCompleto = [
    speaker.nombre,
    speaker.apellidoPa,
    speaker.apellidoMa,
  ]
    .filter(Boolean)
    .join(" ");

  return {
    idPonente: speaker.idPonente,
    nombreCompleto,
  };
}

function mapActivity(
  activity: SubEventDetailsApi,
  idEvento: number,
): EventActivityViewModel {
  return {
    idSubEvento: activity.idSubEvento,
    idEvento,

    nombre: activity.nombre,
    descripcion: activity.descripcion,

    estado: activity.estado,
    accesoQR: activity.accesoQR,
    modalidadAcceso: activity.modalidadAcceso,
    requiereSeleccionAsiento:
    activity.requiereSeleccionAsiento,

    fecha: activity.fecha
      ? {
        fecha: activity.fecha.fecha,
        horaInicio: activity.fecha.horaInicio,
        horaFin: activity.fecha.horaFin,
      }
      : null,

    recinto: activity.recinto
      ? {
        idRecinto: activity.recinto.idRecinto,
        nombre: activity.recinto.nombre,
        aforo: activity.recinto.aforo,
      }
      : null,

    ponentes: activity.ponentes.map(mapSpeaker),

    disponibilidad: {
      estado: "pendiente",
      lugaresDisponibles: null,
      permiteReservar: null,
    },

    estadoReservaUsuario: "no-consultado",
  };
}

export function toEventDetailsViewModel(
  event: EventDetailsApi,
): EventDetailsViewModel {
  return {
    idEvento: event.idEvento,

    nombre: event.nombre,
    descripcion: event.descripcion,

    posterReferencia: event.poster.trim() || null,

    idAlcance: event.idAlcance ?? null,
    esAccesoLibre: event.esAccesoLibre,
    requiereCuenta: event.requiereCuenta,

    actividades: event.subEventos.map((activity) =>
      mapActivity(activity, event.idEvento),
    ),
  };
}

export function getActivityById(
  event: EventDetailsViewModel,
  idSubEvento: number,
): EventActivityViewModel | null {
  return (
    event.actividades.find(
      (activity) =>
        activity.idSubEvento === idSubEvento,
    ) ?? null
  );
}

export function withAvailability(
  activity: EventActivityViewModel,
  availability: EventAvailabilityApi,
): EventActivityViewModel {
  if (
    activity.idSubEvento !== availability.idSubEvento
  ) {
    throw new Error(
      "La disponibilidad no corresponde a esta actividad.",
    );
  }

  return {
    ...activity,

    recinto: activity.recinto ?? {
      idRecinto: availability.recinto.idRecinto,
      nombre: availability.recinto.nombre,
      aforo: availability.recinto.aforo,
    },

    requiereSeleccionAsiento:
    availability.requiereSeleccionAsiento,

    disponibilidad: {
      estado: "lista",
      lugaresDisponibles:
      availability.lugaresDisponibles,
      permiteReservar: availability.permiteReservar,
    },
  };
}