import { useState } from "react";
import { Button } from "../../../../components/atoms/Button/Button";
import { ConfirmationDialog } from "../../../../components/organisms/ConfirmationDialog/ConfirmationDialog";
import { ReservationSummary } from "../molecules/ReservationSummary";
import { SeatMap } from "./SeatMap";
import type { SeatMapItem } from "./SeatMap";
import { ReservationSuccessDialog } from "./ReservationSuccessDialog";
import type { CreateReservationResponse } from "../../services/reservations.service";

export interface ReservationPanelProps {
  eventName: string;
  parentEventName?: string;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  seats: SeatMapItem[];
  onReserve: (idAsiento: number) => Promise<CreateReservationResponse | void>;
  canReserve?: boolean;
  aisleAfter?: number[];
}

export function ReservationPanel({
  eventName,
  parentEventName,
  date,
  startTime,
  endTime,
  venue,
  seats,
  onReserve,
  canReserve = true,
  aisleAfter = [],
}: ReservationPanelProps) {
  const [selectedSeatId, setSelectedSeatId] = useState<number | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isReserved, setIsReserved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [ticketId, setTicketId] = useState<number | null>(null);
  const [ticketQr, setTicketQr] = useState<string | null>(null);

  const selectedSeat = seats.find((seat) => seat.idAsiento === selectedSeatId && !seat.occupied) ?? null;
  const selectedSeatLabel = selectedSeat ? `${selectedSeat.fila}${selectedSeat.numero}` : null;

  const handleConfirm = async () => {
    if (!selectedSeat || isLoading || isReserved || !canReserve) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await onReserve(selectedSeat.idAsiento);
      if (result) {
        setTicketId(result.boleto.idBoleto);
        setTicketQr(result.qr ?? null);
      }
      setIsReserved(true);
      setIsConfirmOpen(false);
      setIsSuccessOpen(true);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "No fue posible completar la reservación.");
      setIsConfirmOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="space-y-6 text-eventos-body-text">
      <div className={`grid min-w-0 grid-cols-1 items-start gap-6 ${isReserved ? "" : "xl:grid-cols-[minmax(0,1fr)_minmax(20rem,22rem)]"}`}>
        {!isReserved && (
          <div className="min-w-0">
            <SeatMap
              seats={seats}
              selectedSeatId={selectedSeat?.idAsiento ?? null}
              onSelect={(idAsiento) => {
                if (!canReserve) return;
                setSelectedSeatId(idAsiento);
                setError(null);
              }}
              aisleAfter={aisleAfter}
              venueName={venue}
            />
          </div>
        )}

        <aside className="min-w-0 space-y-4">
          <ReservationSummary
            eventName={eventName}
            parentEventName={parentEventName}
            date={date}
            startTime={startTime}
            endTime={endTime}
            venue={venue}
            selectedSeatLabel={selectedSeatLabel}
          />

          {error && (
            <p role="alert" className="rounded-md border border-eventos-error p-3 text-sm text-eventos-error">
              {error}
            </p>
          )}

          {isReserved ? (
            <p role="status" className="font-semibold text-eventos-success">
              Reservación registrada correctamente.
            </p>
          ) : (
            <Button
              text="Reservar asiento"
              fullWidth
              disabled={!selectedSeat || isLoading || !canReserve}
              onClick={() => setIsConfirmOpen(true)}
            />
          )}
        </aside>
      </div>

      <ConfirmationDialog
        isOpen={isConfirmOpen}
        title="Confirmar reservación"
        description={`¿Deseas reservar el asiento ${selectedSeatLabel ?? ""} para ${eventName}?`}
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
        ticketId={ticketId}
        qr={ticketQr}
        onClose={() => setIsSuccessOpen(false)}
      />
    </section>
  );
}

export default ReservationPanel;
