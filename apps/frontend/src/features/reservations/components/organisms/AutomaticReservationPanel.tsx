import { useState } from "react";
import { Button } from "../../../../components/atoms/Button/Button";
import { ConfirmationDialog } from "../../../../components/organisms/ConfirmationDialog/ConfirmationDialog";
import { ReservationSummary } from "../molecules/ReservationSummary";
import { ReservationSuccessDialog } from "./ReservationSuccessDialog";
import type { CreateReservationResponse } from "../../services/reservations.service";

export interface AutomaticReservationPanelProps {
  eventName: string;
  parentEventName?: string;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  onReserve: () => Promise<CreateReservationResponse | void>;
  canReserve?: boolean;
}

export function AutomaticReservationPanel({
  eventName,
  parentEventName,
  date,
  startTime,
  endTime,
  venue,
  onReserve,
  canReserve = true,
}: AutomaticReservationPanelProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isReserved, setIsReserved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [ticketId, setTicketId] = useState<number | null>(null);
  const [ticketQr, setTicketQr] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (isLoading || isReserved || !canReserve) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await onReserve();
      if (result) {
        setTicketId(result.boleto.idBoleto);
        setTicketQr(result.qr ?? null);
      }
      setIsReserved(true);
      setIsConfirmOpen(false);
      setIsSuccessOpen(true);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "No fue posible reservar un lugar.");
      setIsConfirmOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="space-y-6 text-eventos-body-text">
      <ReservationSummary
        eventName={eventName}
        parentEventName={parentEventName}
        date={date}
        startTime={startTime}
        endTime={endTime}
        venue={venue}
        selectedSeatLabel={null}
        showSeat={false}
      />

      <div className="rounded-xl border border-eventos-panel-border bg-eventos-panel-surface p-5">
        <h2 className="text-xl font-semibold text-eventos-ink">Reservación de lugar</h2>
        <p className="mt-3 text-sm">
          Para esta actividad no necesitas seleccionar un asiento numerado. Al confirmar se registrará tu lugar disponible.
        </p>
      </div>

      {error && <p role="alert" className="rounded-md border border-eventos-error p-3 text-sm text-eventos-error">{error}</p>}
      {isReserved ? (
        <p role="status" className="font-semibold text-eventos-success">Reservación registrada correctamente.</p>
      ) : (
        <Button text="Reservar lugar" disabled={isLoading || !canReserve} onClick={() => setIsConfirmOpen(true)} />
      )}

      <ConfirmationDialog
        isOpen={isConfirmOpen}
        title="Confirmar reservación"
        description={`¿Deseas reservar un lugar para ${eventName}?`}
        confirmText="Confirmar reservación"
        cancelText="Volver"
        isLoading={isLoading}
        onConfirm={handleConfirm}
        onCancel={() => setIsConfirmOpen(false)}
      />

      <ReservationSuccessDialog
        isOpen={isSuccessOpen}
        eventName={eventName}
        ticketId={ticketId}
        qr={ticketQr}
        onClose={() => setIsSuccessOpen(false)}
      />
    </section>
  );
}

export default AutomaticReservationPanel;
