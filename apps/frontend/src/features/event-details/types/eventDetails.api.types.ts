import type {
  AlcanceEvento,
  ModalidadAcceso,
  EstadoSubEvento,
} from "@eventos/shared";

export interface EventDateApi {
  idFecha: number;
  fecha: string;
  horaInicio: string;
  horaFin: string;
}

export interface EventVenueApi {
  idRecinto: number;
  nombre: string;
  aforo: number;
}

export interface EventSpeakerApi {
  idPonente: number;
  nombre: string;
  apellidoPa: string;
  apellidoMa: string | null;
}

export interface SubEventDetailsApi {
  idSubEvento: number;
  nombre: string;
  descripcion: string;
  estado: EstadoSubEvento;
  accesoQR: boolean;
  modalidadAcceso: ModalidadAcceso;
  requiereSeleccionAsiento: boolean;
  fecha: EventDateApi | null;
  recinto: EventVenueApi | null;
  ponentes: EventSpeakerApi[];
}

export interface EventDetailsApi {
  idEvento: number;
  nombre: string;
  descripcion: string;
  poster: string;
  idAlcance: AlcanceEvento | undefined;
  esAccesoLibre: boolean;
  requiereCuenta: boolean;
  subEventos: SubEventDetailsApi[];
}

export interface EventSeatApi {
  idAsiento: number;
  fila: string;
  numero: number;
  ocupado: boolean;
}

export interface EventAvailabilityApi {
  idSubEvento: number;
  recinto: EventVenueApi;
  lugaresDisponibles: number;
  permiteReservar: boolean;
  requiereSeleccionAsiento: boolean;
  asientos: EventSeatApi[];
}