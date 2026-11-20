import { useCallback, useEffect, useState } from "react";
import { Button } from "../../../../components/atoms/Button/Button";
import { ConfirmationDialog } from "../../../../components/organisms/ConfirmationDialog/ConfirmationDialog";
import { ReservationCountdown } from "../molecules/ReservationCountdown";
import { ReservationSummary } from "../molecules/ReservationSummary";
import { SeatMap } from "./SeatMap";
import type { SeatMapItem } from "./SeatMap";
import { ReservationSuccessDialog } from "./ReservationSuccessDialog";
import { ReservationAvailabilityIndicator } from "../molecules/ReservationAvailabilityIndicator";
import { getSeatHoldErrorMessage, useSeatHold } from "../../hooks/useSeatHold";

export interface ReservationPanelProps {
  idSubEvento: number;
  eventName: string;
  parentEventName?: string;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  seats: SeatMapItem[];
  onAvailabilityChange: () => void;
  canReserve?: boolean;
  aisleAfter?: number[];
  availableSeats: number;
  capacity: number;
  isRefreshing?: boolean;
}

export function ReservationPanel({
  idSubEvento,
  eventName,
  parentEventName,
  date,
  startTime,
  endTime,
  venue,
  seats,
  onAvailabilityChange,
  canReserve = true,
  aisleAfter = [],
  availableSeats,
  capacity,
  isRefreshing = false,
}: ReservationPanelProps) {
  const {
    hold,
    expiresAt,
    syncStatus,
    pendingAction,
    pendingSeatId,
    error,
    selectSeat,
    confirmHold,
    syncHold,
    expireHold,
    clearError,
  } = useSeatHold(idSubEvento, onAvailabilityChange);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmationSeatId, setConfirmationSeatId] = useState<number | null>(null);
  const [isReserved, setIsReserved] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [ticketId, setTicketId] = useState<number | null>(null);
  const [ticketQr, setTicketQr] = useState<string | null>(null);
  const [confirmedSeatLabel, setConfirmedSeatLabel] = useState<string | null>(null);

  const selectedSeatLabel = hold ? `${hold.fila}${hold.numero}` : null;

  const displayedSeatLabel = isReserved
    ? confirmedSeatLabel
    : selectedSeatLabel;

  const showMobileActions =
    !isReserved && (hold !== null || error !== null || notice !== null);

  const canConfirm =
    hold !== null &&
    syncStatus === "ready" &&
    pendingAction === null &&
    !isReserved &&
    expiresAt !== null &&
    Date.now() < expiresAt;

  const expireSelection = useCallback(() => {
    if (pendingAction === "confirming") return;
    expireHold();
    setIsConfirmOpen(false);
    setConfirmationSeatId(null);
  }, [expireHold, pendingAction]);

  useEffect(() => {
    if (!isConfirmOpen || pendingAction === "confirming") return;
    if (confirmationSeatId === null || hold?.idAsiento !== confirmationSeatId) {
      if (hold && confirmationSeatId !== null) {
        setNotice("Tu asiento cambió en otra pestaña. Revisa la selección antes de confirmar.");
      }
      setIsConfirmOpen(false);
      setConfirmationSeatId(null);
    }
  }, [confirmationSeatId, hold, isConfirmOpen, pendingAction]);

  const handleSeatSelection = (idAsiento: number) => {
    if (pendingAction !== null || isConfirmOpen || isReserved) return;
    if (hold === null && !canReserve) return;
    setNotice(null);
    clearError();
    void selectSeat(idAsiento);
  };

  const handleOpenConfirmation = () => {
    if (!canConfirm || hold === null) return;
    setNotice(null);
    setConfirmationSeatId(hold.idAsiento);
    setIsConfirmOpen(true);
  };

  const handleConfirm = async () => {
    if (!canConfirm || confirmationSeatId === null) return;
    const seatLabel = selectedSeatLabel;

    try {
      const result = await confirmHold(confirmationSeatId);
      setTicketId(result.boleto.idBoleto);
      setTicketQr(result.qr ?? null);
      setConfirmedSeatLabel(seatLabel);
      setIsReserved(true);
      setIsConfirmOpen(false);
      setConfirmationSeatId(null);
      setIsSuccessOpen(true);
    } catch (cause: unknown) {
      setNotice(getSeatHoldErrorMessage(cause));
      setIsConfirmOpen(false);
      setConfirmationSeatId(null);
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
              selectedSeatId={hold?.idAsiento ?? null}
              onSelect={handleSeatSelection}
              disabled={
                syncStatus !== "ready" ||
                pendingAction !== null ||
                isConfirmOpen ||
                (!canReserve && hold === null)
              }
              pendingSeatId={pendingSeatId}
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

          {!isReserved && syncStatus === "loading" && (
            <p role="status" className="sr-only">
              Comprobando si tienes un asiento apartado...
            </p>
          )}

          {!isReserved && syncStatus === "error" && (
            <button
              type="button"
              onClick={() => void syncHold()}
              className="rounded-md border border-eventos-primary px-4 py-2 font-semibold text-eventos-primary"
            >
              Reintentar consulta de asiento
            </button>
          )}

          {!isReserved && !canReserve && hold === null && syncStatus === "ready" && (
            <p role="status" className="text-sm text-eventos-muted-text">
              No hay asientos disponibles para esta actividad en este momento.
            </p>
          )}

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

              {(notice || error) && (
                <p
                  role="alert"
                  className="rounded-md border border-eventos-error p-3 text-sm text-eventos-error"
                >
                  {notice || error}
                </p>
              )}

              <Button
                text="Reservar asiento"
                fullWidth
                disabled={!canConfirm}
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
        isLoading={pendingAction === "confirming"}
        onConfirm={handleConfirm}
        onCancel={() => {
          setIsConfirmOpen(false);
          setConfirmationSeatId(null);
        }}
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
