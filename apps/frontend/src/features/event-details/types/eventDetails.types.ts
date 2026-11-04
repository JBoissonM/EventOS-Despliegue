import type { AlcanceEvento } from "@eventos/shared";

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

export interface EventActivityViewModel {
  idSubEvento: number;
  idEvento: number;
  nombre: string;
  descripcion: string;
  accesoQR: boolean;
  requiereSeleccionAsiento: boolean;
  fecha: EventDateViewModel | null;
  recinto: EventVenueViewModel | null;
  ponentes: EventSpeakerViewModel[];
}

export interface EventDetailsViewModel {
  idEvento: number;
  nombre: string;
  descripcion: string;
  posterReferencia: string | null;
  idAlcance: AlcanceEvento;
  actividades: EventActivityViewModel[];
}
