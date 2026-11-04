import type { AlcanceEvento, EstadoSubEvento } from "@eventos/shared";

export interface CatalogDateApi {
  fecha: string;
  horaInicio: string;
  horaFin: string;
}

export interface CatalogVenueApi {
  idRecinto: number;
  nombre: string;
  aforo: number;
}

export interface CatalogSpeakerApi {
  idPonente: number;
  nombre: string;
  apellidoPa: string;
  apellidoMa: string | null;
}

export interface CatalogActivityApi {
  idSubEvento: number;
  nombre: string;
  accesoQR: boolean;
  fecha: CatalogDateApi | null;
  recinto: CatalogVenueApi | null;
  ponentes: CatalogSpeakerApi[];
  estado: EstadoSubEvento;
}

export interface CatalogEventApi {
  idEvento: number;
  nombre: string;
  descripcion: string;
  poster: string;
  idAlcance: AlcanceEvento;
  subEventos: CatalogActivityApi[];
}
