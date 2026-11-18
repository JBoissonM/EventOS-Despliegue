import { useCallback, useEffect, useState } from "react";
import { Button } from "../../../../components/atoms/Button/Button";
import { ConfirmationDialog } from "../../../../components/organisms/ConfirmationDialog/ConfirmationDialog";
import { ReservationCountdown } from "../molecules/ReservationCountdown";
import { ReservationSummary } from "../molecules/ReservationSummary";
import { SeatMap } from "./SeatMap";
import type { SeatMapItem } from "./SeatMap";
import { ReservationSuccessDialog } from "./ReservationSuccessDialog";
import type { CreateReservationResponse } from "../../services/reservations.service";
import { ReservationAvailabilityIndicator } from "../molecules/ReservationAvailabilityIndicator";

const SELECTION_DURATION_MS = 5 * 60 * 1000;

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
  availableSeats: number;
  capacity: number;
  isRefreshing?: boolean;
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
                                   availableSeats,
                                   capacity,
                                   isRefreshing = false,
                                 }: ReservationPanelProps) {
  const [selectedSeatId, setSelectedSeatId] = useState<number | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isReserved, setIsReserved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [ticketId, setTicketId] = useState<number | null>(null);
  const [ticketQr, setTicketQr] = useState<string | null>(null);
  const [confirmedSeatLabel, setConfirmedSeatLabel] = useState<string | null>(null);

  const selectedSeat =
    seats.find(
      (seat) => seat.idAsiento === selectedSeatId && !seat.occupied,
    ) ?? null;

  const selectedSeatLabel = selectedSeat
    ? `${selectedSeat.fila}${selectedSeat.numero}`
    : null;

  const displayedSeatLabel = isReserved
    ? confirmedSeatLabel
    : selectedSeatLabel;

  const showMobileActions =
    !isReserved && (selectedSeat !== null || error !== null);

  const expireSelection = useCallback(() => {
    if (isLoading || isReserved) return;

    setSelectedSeatId(null);
    setExpiresAt(null);
    setIsConfirmOpen(false);
    setError(
      "Se agotaron los cinco minutos para confirmar tu selección. Elige un asiento para comenzar de nuevo.",
    );
  }, [isLoading, isReserved]);

  useEffect(() => {
    if (isReserved || selectedSeatId === null) return;

    const seatStillAvailable = seats.some(
      (seat) =>
        seat.idAsiento === selectedSeatId &&
        !seat.occupied,
    );

    if (!seatStillAvailable) {
      setSelectedSeatId(null);
      setExpiresAt(null);
      setIsConfirmOpen(false);
      setError(
        "El asiento seleccionado ya no está disponible. Selecciona otro asiento.",
      );
    }
  }, [seats, selectedSeatId, isReserved]);

  const handleSeatSelection = (idAsiento: number) => {
    if (!canReserve || isLoading || isReserved) return;

    if (expiresAt !== null && Date.now() >= expiresAt) {
      expireSelection();
      return;
    }

    setSelectedSeatId(idAsiento);

    setExpiresAt(
      (current) => current ?? Date.now() + SELECTION_DURATION_MS,
    );

    setError(null);
  };

  const handleOpenConfirmation = () => {
    if (!selectedSeat || !canReserve || isLoading || isReserved) return;

    if (expiresAt === null || Date.now() >= expiresAt) {
      expireSelection();
      return;
    }

    setIsConfirmOpen(true);
  };

  const handleConfirm = async () => {
    if (!selectedSeat || isLoading || isReserved || !canReserve) return;

    if (expiresAt === null || Date.now() >= expiresAt) {
      expireSelection();
      return;
    }

    const seatId = selectedSeat.idAsiento;
    const seatLabel = selectedSeatLabel;

    setIsLoading(true);
    setError(null);

    try {
      const result = await onReserve(seatId);

      if (result) {
        setTicketId(result.boleto.idBoleto);
        setTicketQr(result.qr ?? null);
      }

      setConfirmedSeatLabel(seatLabel);
      setIsReserved(true);
      setIsConfirmOpen(false);
      setIsSuccessOpen(true);
    } catch (cause: unknown) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No fue posible completar la reservación.",
      );

      setIsConfirmOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section
      className={`space-y-6 text-eventos-body-text ${
        showMobileActions ? "pb-44 xl:pb-0" : ""
      }`}
    >
      <div
        className={`grid min-w-0 grid-cols-1 items-start gap-6 ${
          isReserved
            ? ""
            : "xl:grid-cols-[minmax(0,1fr)_minmax(20rem,22rem)]"
        }`}
      >
        {!isReserved && (
          <div className="min-w-0">
            <SeatMap
              seats={seats}
              selectedSeatId={selectedSeat?.idAsiento ?? null}
              onSelect={handleSeatSelection}
              aisleAfter={aisleAfter}
              venueName={venue}
            />
          </div>
        )}

        <aside
          className={`min-w-0 space-y-4 ${
            isReserved ? "" : "xl:pt-10"
          }`}
        >
          {!isReserved && (
            <div className="hidden xl:block">
              <ReservationAvailabilityIndicator
                availableSeats={availableSeats}
                capacity={capacity}
                isRefreshing={isRefreshing}
              />
            </div>
          )}

          <ReservationSummary
            eventName={eventName}
            parentEventName={parentEventName}
            date={date}
            startTime={startTime}
            endTime={endTime}
            venue={venue}
            selectedSeatLabel={displayedSeatLabel}
          />

          {isReserved ? (
            <p
              role="status"
              className="font-semibold text-eventos-success"
            >
              Reservación registrada correctamente.
            </p>
          ) : (
            <div
              className={`space-y-3 ${
                showMobileActions
                  ? "fixed inset-x-0 bottom-0 z-30 border-t border-eventos-panel-border bg-eventos-panel-surface px-4 py-3 shadow-lg xl:static xl:border-0 xl:bg-transparent xl:px-0 xl:py-0 xl:shadow-none"
                  : ""
              }`}
            >
              {(selectedSeatLabel || expiresAt !== null) && (
                <div className="flex items-center justify-between gap-2 xl:block">
                  {selectedSeatLabel && (
                    <p className="min-w-0 truncate text-sm font-semibold text-eventos-secondary xl:hidden">
                      Asiento: {selectedSeatLabel}
                    </p>
                  )}

                  {expiresAt !== null && (
                    <ReservationCountdown
                      expiresAt={expiresAt}
                      onExpire={expireSelection}
                    />
                  )}
                </div>
              )}

              {error && (
                <p
                  role="alert"
                  className="rounded-md border border-eventos-error p-3 text-sm text-eventos-error"
                >
                  {error}
                </p>
              )}

              <Button
                text="Reservar asiento"
                fullWidth
                disabled={!selectedSeat || isLoading || !canReserve}
                onClick={handleOpenConfirmation}
              />
            </div>
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
        seatLabel={displayedSeatLabel}
        ticketId={ticketId}
        qr={ticketQr}
        onClose={() => setIsSuccessOpen(false)}
      />
    </section>
  );
}

export default ReservationPanel;