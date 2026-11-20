import type {
  DisponibilidadSubEvento,
  RetencionAsientoActiva,
  RetencionAsientoActualRespuesta,
} from "@eventos/shared";
import { apiRequest } from "../../../lib/apiClient";
import type { SeatMapItem } from "../components/organisms/SeatMap";

export interface ReservationAvailability extends DisponibilidadSubEvento {
  permiteReservar: boolean;
  requiereSeleccionAsiento: boolean;
}

export interface CreateReservationInput {
  idSubEvento: number;
  idAsiento?: number;
  idRetencionAsiento?: number;
}

export interface CreatedTicket {
  idBoleto: number;
  idAsiento: number | null;
  idEstadoBoleto: number;
}

export interface CreateReservationResponse {
  mensaje: string;
  boleto: CreatedTicket;
  qr?: string;
}

export const reservationsService = {
  acquireHold(
    idSubEvento: number,
    idAsiento: number,
  ): Promise<RetencionAsientoActiva> {
    return apiRequest<RetencionAsientoActiva>("reservations/holds", {
      method: "POST",
      body: JSON.stringify({ idSubEvento, idAsiento }),
    });
  },

  changeHoldSeat(
    idRetencionAsiento: number,
    idAsiento: number,
  ): Promise<RetencionAsientoActiva> {
    return apiRequest<RetencionAsientoActiva>(`reservations/holds/${idRetencionAsiento}`, {
      method: "PATCH",
      body: JSON.stringify({ idAsiento }),
    });
  },

  releaseHold(idRetencionAsiento: number): Promise<void> {
    return apiRequest<void>(`reservations/holds/${idRetencionAsiento}`, {
      method: "DELETE",
    });
  },

  getCurrentHold(
    idSubEvento: number,
    signal?: AbortSignal,
  ): Promise<RetencionAsientoActualRespuesta> {
    return apiRequest<RetencionAsientoActualRespuesta>(
      `reservations/holds/actual?idSubEvento=${idSubEvento}`,
      { signal },
    );
  },

  getAvailability(
    idSubEvento: number,
    signal?: AbortSignal,
  ): Promise<ReservationAvailability> {
    return apiRequest<ReservationAvailability>(
      `reservations/disponibilidad/${idSubEvento}`,
      { signal },
    );
  },

  createReservation(
    data: CreateReservationInput,
  ): Promise<CreateReservationResponse> {
    return apiRequest<CreateReservationResponse>("reservations", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};

export function toSeatMapItems(
  seats: ReservationAvailability["asientos"],
): SeatMapItem[] {
  return seats.map((seat) => ({
    idAsiento: seat.idAsiento,
    fila: seat.fila,
    numero: seat.numero,
    occupied: seat.ocupado,
    estado: seat.estado ?? (seat.ocupado ? "OCUPADO" : "DISPONIBLE"),
  }));
}
