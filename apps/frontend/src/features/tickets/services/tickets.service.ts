import { apiRequest, apiRequestPdf } from "../../../lib/apiClient";
import type { EstadoBoleto } from "@eventos/shared";

export interface TicketSpeakerResponse {
  idPonente: number;
  nombreCompleto: string;
  correo?: string | null;
}

export interface TicketSummaryResponse {
  idBoleto: number;
  idEvento: number;
  idSubEvento: number;
  nombreEvento: string;
  nombreSubEvento: string;
  estadoBoleto: EstadoBoleto;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  recinto: string;
  fechaGeneracion?: string;
  estadoBoletoTexto?: string;
  etiquetaEstado?: string;
  poster: string | null;
  alcance: string;
  accesoQR: boolean;
  filaAsiento: string | null;
  numeroAsiento: number | null;
  ponentes: TicketSpeakerResponse[];
  qrImagenBase64?: string | null;
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
    return apiRequest<TicketSummaryResponse[]>("reservations/mis-boletos", { signal });
  },

  getTicketDetail(idBoleto: number): Promise<TicketDetailResponse> {
    return apiRequest<TicketDetailResponse>(`reservations/mis-boletos/${idBoleto}`);
  },

  downloadTicketPdf(idBoleto: number): Promise<Blob> {
    return apiRequestPdf(`reservations/mis-boletos/${idBoleto}/pdf`);
  },

  cancelTicket(idBoleto: number): Promise<CancelTicketResponse> {
    return apiRequest<CancelTicketResponse>(`reservations/${idBoleto}/cancelar`, {
      method: "PATCH",
    });
  },
};
