import type {
  Evento,
  SubEvento,
  Fecha,
  Recinto,
  Ponente,
} from "@eventos/shared";

export type ReservationUserStatus =
  | "desconocido"
  | "sin-reserva"
  | "reservado";

export type VenueDetails = Pick<
  Recinto,
  "idRecinto" | "nombre" | "aforo"
>;

export interface EventActivityViewModel {
  idSubEvento: SubEvento["idSubEvento"];
  idEvento: SubEvento["idEvento"];

  nombre: SubEvento["nombre"];
  estado: SubEvento["estado"];

  fecha: Fecha["fecha"];
  horaInicio: Fecha["horaInicio"];
  horaFin: Fecha["horaFin"];

  recinto: VenueDetails;

  lugaresDisponibles: number | null;

  estadoReservaUsuario: ReservationUserStatus;
}

export interface EventDetailsViewModel
  extends Pick<
    Evento,
    "idEvento" | "nombre" | "descripcion" | "poster"
  > {
  actividades: EventActivityViewModel[];
}

export type SpeakerViewModel = Pick<
  Ponente,
  "idPonente" | "nombre" | "apellidoPa" | "apellidoMa"
>;

export interface SubEventDetailsViewModel
  extends EventActivityViewModel {
  descripcion: SubEvento["descripcion"];
  accesoQR: SubEvento["accesoQR"];
  ponentes: SpeakerViewModel[];
}