
import { useEffect, useId, useRef } from "react";
import { type ModalidadAcceso, esModalidadConQr } from "@eventos/shared";
import { Button } from "../../../../components/atoms/Button/Button";

export interface ReservationSuccessDialogProps {
  isOpen: boolean;
  eventName: string;
  seatLabel?: string | null;
  ticketId?: number | null;
  qr?: string | null;
  idModalidadAcceso?: ModalidadAcceso;
  onClose: () => void;
  onViewTicket?: () => void;
}

export function ReservationSuccessDialog({
                                           isOpen,
                                           eventName,
                                           seatLabel,
                                           ticketId,
                                           qr,
                                           idModalidadAcceso,
                                           onClose,
                                           onViewTicket,
                                         }: ReservationSuccessDialogProps) {
  const requiresQr = idModalidadAcceso === undefined
    ? Boolean(qr)
    : esModalidadConQr(idModalidadAcceso);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className="
        m-auto w-full max-w-md rounded-xl
        border-0 bg-eventos-surface p-6 text-eventos-ink
        shadow-xl backdrop:bg-eventos-ink/50
      "
    >
      <div className="space-y-5">
        <div className="space-y-3 text-center">
          <div
            aria-hidden="true"
            className="
              mx-auto flex h-14 w-14
              items-center justify-center rounded-full
              bg-eventos-secondary-light
              text-2xl text-secondary
            "
          >
            ✓
          </div>

          <h2
            id={titleId}
            className="font-merriweather text-xl font-bold"
          >
            {seatLabel ? "Asiento reservado" : "Reservación confirmada"}
          </h2>

          <p
            id={descriptionId}
            className="font-merriweather text-sm"
          >
            Tu reservación para {eventName} se
            registró correctamente.
            {ticketId && (
              <span className="mt-2 block font-semibold">
                {requiresQr ? `Boleto #${ticketId}` : `Registro #${ticketId}`}
              </span>
            )}
            {!requiresQr && (
              <span className="mt-2 block text-xs text-eventos-muted-text">
                Esta modalidad no genera código QR. Tu acceso se valida con tu nombre o correo en la lista de asistencia.
              </span>
            )}
            {seatLabel && (
              <span className="mt-2 block font-semibold">
                Asiento: {seatLabel}
              </span>
            )}
          </p>
        </div>

        {qr && (
          <div className="mx-auto max-w-44 space-y-2 text-center">
            <img className="mx-auto w-full rounded-md border border-eventos-panel-border" src={qr.startsWith("data:image/") ? qr : `data:image/png;base64,${qr}`} alt={`Código QR del boleto ${ticketId ?? "reservado"}`} />
            <p className="text-xs text-eventos-muted-text">Conserva este código para el acceso a la actividad.</p>
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-3">
          {onViewTicket && Boolean(qr) && requiresQr && (
            <Button
              text="Ver código QR"
              variant="outline"
              onClick={onViewTicket}
            />
          )}

          <Button
            text="Aceptar"
            onClick={onClose}
          />
        </div>
      </div>
    </dialog>
  );
}

export default ReservationSuccessDialog;
