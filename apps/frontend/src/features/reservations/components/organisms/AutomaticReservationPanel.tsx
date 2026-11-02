import { useState } from "react";
import { ApiError } from "../../../../lib/apiClient";

import { Button } from "../../../../components/atoms/Button/Button";
import { ConfirmationDialog } from "../../../../components/organisms/ConfirmationDialog/ConfirmationDialog";
import { ReservationSummary } from "../molecules/ReservationSummary";
import { ReservationSuccessDialog } from "./ReservationSuccessDialog";

export interface AutomaticReservationPanelProps {
  eventName: string;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  onReserve: () => Promise<number | void>;
  onViewTicket?: (idBoleto: number) => void;
  availableSeats?: number;
}

export function AutomaticReservationPanel({
                                            eventName,
                                            date,
                                            startTime,
                                            endTime,
                                            venue,
                                            onReserve,
                                            onViewTicket,
                                            availableSeats,
                                          }: AutomaticReservationPanelProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isReserved, setIsReserved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [createdTicketId, setCreatedTicketId] = useState<number | null>(null);

  const handleConfirm = async () => {
    if (isLoading || isReserved) return;

    setIsLoading(true);
    setError(null);

    try {
      const ticketId = await onReserve();

      if (typeof ticketId === "number") setCreatedTicketId(ticketId);
      setIsReserved(true);
      setIsConfirmOpen(false);
      setIsSuccessOpen(true);
    } catch (cause) {
      const message = cause instanceof ApiError && cause.status === 409
        ? `${cause.message} La disponibilidad se está actualizando.`
        : "No fue posible reservar un lugar. Comprueba tu conexión e inténtalo nuevamente.";
      setError(message);
      setIsConfirmOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="space-y-6">
      <ReservationSummary
        eventName={eventName}
        date={date}
        startTime={startTime}
        endTime={endTime}
        venue={venue}
        selectedSeatLabel={null}
        availableSeats={availableSeats}
        showSeat={false}
      />

      <div className="rounded-xl border border-eventos-neutral p-5">
        <h2 className="font-merriweather text-xl font-bold">
          Reservación de lugar
        </h2>

        <p className="mt-3 text-sm text-gray-600">
          Para este recinto no necesitas seleccionar un asiento.
          Tu reservación registrará un cupo general, sin asiento numerado.
        </p>
      </div>

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
        <Button
          text="Reservar lugar"
          disabled={isLoading}
          onClick={() => setIsConfirmOpen(true)}
        />
      )}

      <ConfirmationDialog
        isOpen={isConfirmOpen}
        title="Confirmar reservación"
        description={`¿Deseas reservar un lugar para el evento ${eventName}?`}
        confirmText="Confirmar reservación"
        cancelText="Volver"
        isLoading={isLoading}
        onConfirm={handleConfirm}
        onCancel={() => setIsConfirmOpen(false)}
      />

      <ReservationSuccessDialog
        isOpen={isSuccessOpen}
        eventName={eventName}
        onClose={() => setIsSuccessOpen(false)}
        onViewTicket={createdTicketId !== null && onViewTicket
          ? () => onViewTicket(createdTicketId)
          : undefined}
      />
    </section>
  );
}

export default AutomaticReservationPanel;
