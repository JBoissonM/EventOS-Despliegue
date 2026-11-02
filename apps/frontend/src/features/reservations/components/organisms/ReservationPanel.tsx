import { useState } from "react";
import { ApiError } from "../../../../lib/apiClient";
import { Button } from "../../../../components/atoms/Button/Button";
import { ConfirmationDialog } from "../../../../components/organisms/ConfirmationDialog/ConfirmationDialog";
import { ReservationSummary } from "../molecules/ReservationSummary";
import { SeatMap } from "./SeatMap";
import type { SeatMapItem } from "./SeatMap";
import { ReservationSuccessDialog } from "./ReservationSuccessDialog";

export interface ReservationPanelProps {
  eventName: string;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  seats: SeatMapItem[];
  onReserve: (idAsiento: number) => Promise<number | void>;
  onViewTicket?: (idBoleto: number) => void;
  availableSeats?: number;
  aisleAfter?: number[];
}

export function ReservationPanel({
                                   eventName,
                                   date,
                                   startTime,
                                   endTime,
                                   venue,
                                   seats,
                                   onReserve,
                                   onViewTicket,
                                   availableSeats,
                                   aisleAfter = [],
                                 }: ReservationPanelProps) {
  const [selectedSeatId, setSelectedSeatId] =
    useState<number | null>(null);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isReserved, setIsReserved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [createdTicketId, setCreatedTicketId] = useState<number | null>(null);

  const selectedSeat =
    seats.find(
      (seat) =>
        seat.idAsiento === selectedSeatId && !seat.occupied,
    ) ?? null;

  const selectedSeatLabel = selectedSeat
    ? `${selectedSeat.fila}${selectedSeat.numero}`
    : null;

  const handleSeatSelect = (idAsiento: number) => {
    setSelectedSeatId(idAsiento);
    setError(null);
  };

  const handleConfirm = async () => {
    if (!selectedSeat || isLoading || isReserved) return;

    setIsLoading(true);
    setError(null);

    try {
      const ticketId = await onReserve(selectedSeat.idAsiento);

      if (typeof ticketId === "number") setCreatedTicketId(ticketId);
      setIsReserved(true);
      setIsConfirmOpen(false);
      setIsSuccessOpen(true);
    } catch (cause) {
      const message = cause instanceof ApiError && cause.status === 409
        ? `${cause.message} La disponibilidad se está actualizando.`
        : "No fue posible completar la reservación. Comprueba tu conexión e inténtalo nuevamente.";
      setError(message);
      setIsConfirmOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const displayedAvailableSeats = availableSeats ?? seats.filter((seat) => !seat.occupied).length;

  const handleCancelSelection = () => {
    setSelectedSeatId(null);
    setError(null);
  };

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px] 2xl:grid-cols-[minmax(0,1fr)_350px]">
        {/* Mapa y acciones de reservación */}
        <div className="min-w-0 space-y-5">
          {!isReserved && (
            <div className="min-w-0">
              <SeatMap
                seats={seats}
                selectedSeatId={selectedSeat?.idAsiento ?? null}
                onSelect={handleSeatSelect}
                aisleAfter={aisleAfter}
                venueName={venue}
              />
            </div>
          )}

          {error && (
            <p role="alert" className="text-sm text-eventos-error">
              {error}
            </p>
          )}

          {isReserved ? (
            <p role="status" className="text-eventos-success">
              Reservación registrada correctamente.
            </p>
          ) : (
            <div className="flex flex-wrap justify-center gap-4">
              <button
                type="button"
                disabled={!selectedSeat || isLoading}
                onClick={handleCancelSelection}
                className="rounded-lg bg-[var(--color-eventos-cancel)] px-6 py-3 font-semibold text-white hover:brightness-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancelar
              </button>

              <Button
                text="Confirmar reserva"
                disabled={!selectedSeat || isLoading}
                onClick={() => setIsConfirmOpen(true)}
              />
            </div>
          )}
        </div>

        {/* Resumen a la derecha del mapa en escritorio */}
        <aside className="min-w-0 xl:sticky xl:top-6">
          <ReservationSummary
            eventName={eventName}
            date={date}
            startTime={startTime}
            endTime={endTime}
            venue={venue}
            selectedSeatLabel={selectedSeatLabel}
            availableSeats={displayedAvailableSeats}
          />
        </aside>
      </div>

      <ConfirmationDialog
        isOpen={isConfirmOpen}
        title="Confirmar reservación"
        description={`¿Deseas reservar el asiento ${
          selectedSeatLabel ?? ""
        } para el evento ${eventName}?`}
        confirmText="Confirmar reservación"
        cancelText="Volver"
        isLoading={isLoading}
        onConfirm={handleConfirm}
        onCancel={() => setIsConfirmOpen(false)}
      />

      <ReservationSuccessDialog
        isOpen={isSuccessOpen}
        eventName={eventName}
        seatLabel={selectedSeatLabel}
        onClose={() => setIsSuccessOpen(false)}
        onViewTicket={createdTicketId !== null && onViewTicket
          ? () => onViewTicket(createdTicketId)
          : undefined}
      />
    </section>
  );
}

export default ReservationPanel;