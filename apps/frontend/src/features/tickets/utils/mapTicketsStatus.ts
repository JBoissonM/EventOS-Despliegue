import { EstadoBoleto } from "@eventos/shared";
import type { TicketStatus } from "../components/molecules/TicketCard";

export function mapTicketStatus(status: EstadoBoleto): TicketStatus {
  switch (status) {
    case EstadoBoleto.VALIDO:
      return "active";
    case EstadoBoleto.UTILIZADO:
      return "checked-in";
    case EstadoBoleto.CANCELADO:
      return "cancelled";
    default:
      return "cancelled";
  }
}
