import { apiRequest, apiRequestPdf } from "../../../lib/apiClient";
import type { AlcanceEvento, EstadoBoleto } from "@eventos/shared";

export interface TicketSummaryResponse {
  idSubEvento: number;
  idBoleto: number;
  idEvento: number;
  nombreEvento: string;
  nombreSubEvento: string;
  ponentes?: string[];
  estadoBoleto: EstadoBoleto;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  recinto: string;
  poster: string | null;
  idAlcance: AlcanceEvento | null;
  accesoQR: boolean;
}

export interface TicketDetailResponse {
  idBoleto: number;
  estadoBoleto: EstadoBoleto;
  qr: string | null;

  evento: {
    idEvento: number;
    nombre: string;
  };

  asiento: {
    fila: string;
    numero: number;
  } | null;

  subEvento: {
    idSubEvento: number;
    idEvento: number;
    nombre: string;
    descripcion: string;
    accesoQR: boolean;
    fecha: string;
    horaInicio: string;
    horaFin: string;
  };

  recinto: {
    idRecinto: number;
    nombre: string;
  };
}

export interface CancelTicketResponse {
  mensaje: string;
  boleto: {
    idBoleto: number;
    idEstadoBoleto: EstadoBoleto;
    idAsiento: number | null;
  };
}

export const ticketsService = {
  getMyTickets(signal?: AbortSignal): Promise<TicketSummaryResponse[]> {
    return apiRequest<TicketSummaryResponse[]>(
      "reservations/mis-boletos",
      { signal },
    );
  },

  getTicketDetail(
    idBoleto: number,
  ): Promise<TicketDetailResponse> {
    return apiRequest<TicketDetailResponse>(
      `reservations/mis-boletos/${idBoleto}`,
    );
  },

  downloadTicketPdf(idBoleto: number): Promise<Blob> {
    return apiRequestPdf(`reservations/mis-boletos/${idBoleto}/pdf`);
  },

  cancelTicket(
    idBoleto: number,
  ): Promise<CancelTicketResponse> {
    return apiRequest<CancelTicketResponse>(
      `reservations/${idBoleto}/cancelar`,
      {
        method: "PATCH",
      },
    );
  },
};