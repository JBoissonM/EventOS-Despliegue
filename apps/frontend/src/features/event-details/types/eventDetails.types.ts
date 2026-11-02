import type {
  AlcanceEvento,
  ModalidadAcceso,
  EstadoSubEvento,
} from "@eventos/shared";

export interface EventDateViewModel {
  fecha: string;
  horaInicio: string;
  horaFin: string;
}

export interface EventVenueViewModel {
  idRecinto: number;
  nombre: string;
  aforo: number;
}

export interface EventSpeakerViewModel {
  idPonente: number;
  nombreCompleto: string;
}

export type ReservationUserStatus =
  | "no-consultado"
  | "sin-reserva"
  | "reservado"
  | "error";

export type AvailabilityStatus =
  | "pendiente"
  | "cargando"
  | "lista"
  | "error";

export interface EventAvailabilityViewModel {
  estado: AvailabilityStatus;
  lugaresDisponibles: number | null;
  permiteReservar: boolean | null;
}

export interface EventActivityViewModel {
  idSubEvento: number;
  idEvento: number;

  nombre: string;
  descripcion: string;

  estado: EstadoSubEvento;
  accesoQR: boolean;
  modalidadAcceso: ModalidadAcceso;
  requiereSeleccionAsiento: boolean;

  fecha: EventDateViewModel | null;
  recinto: EventVenueViewModel | null;

  ponentes: EventSpeakerViewModel[];

  disponibilidad: EventAvailabilityViewModel;
  estadoReservaUsuario: ReservationUserStatus;
}

export interface EventDetailsViewModel {
  idEvento: number;

  nombre: string;
  descripcion: string;
  posterReferencia: string | null;

  idAlcance: AlcanceEvento | null;
  esAccesoLibre: boolean;
  requiereCuenta: boolean;

  actividades: EventActivityViewModel[];
}