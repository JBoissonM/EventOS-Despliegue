import { ArrowLeft } from "lucide-react";
import { Badge } from "../../../../components/atoms/Badge/Badge";
import { Button } from "../../../../components/atoms/Button/Button";

import { QRDisplay } from "../molecules/QRDisplay";
import { TicketPdfPreviewDialog } from "../molecules/TicketPdfPreviewDialog";
import type { TicketStatus } from "../molecules/TicketCard";

export type TicketAssignment =
  | { kind: "seat"; label: string }
  | { kind: "equipment"; label: string }
  | { kind: "general" };

export interface DigitalTicketViewProps {
  eventName: string;
  subEventName?: string;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  attendeeName: string;
  status: TicketStatus;
  assignment?: TicketAssignment;
  qrImageUrl?: string | null;
  hasQr?: boolean;
  onBack: () => void;
  onDownloadPdf?: () => void;
  onPreviewPdf?: () => void;
  onClosePreview?: () => void;
  previewUrl?: string | null;
  isLoadingPreview?: boolean;
  isDownloadingPdf?: boolean;
  downloadError?: string | null;
}

const statusLabels: Record<TicketStatus, string> = {
  active: "Activo",
  "checked-in": "Ingresado",
  cancelled: "Cancelado",
  expired: "Expirado",
};

const statusVariants = {
  active: "success",
  "checked-in": "secondary",
  cancelled: "error",
  expired: "neutral",
} as const;

export function DigitalTicketView({
                                    eventName,
                                    subEventName,
                                    date,
                                    startTime,
                                    endTime,
                                    venue,
                                    attendeeName,
                                    status,
                                    assignment,
                                    qrImageUrl,
                                    hasQr = true,
                                    onBack,
                                    onDownloadPdf,
                                    onPreviewPdf,
                                    onClosePreview,
                                    previewUrl,
                                    isLoadingPreview = false,
                                    isDownloadingPdf = false,
                                    downloadError,
                                  }: DigitalTicketViewProps) {
  const isActive = status === "active";

  const assignmentText =
    assignment?.kind === "seat"
      ? `Asiento: ${assignment.label}`
      : assignment?.kind === "equipment"
        ? `Equipo: ${assignment.label}`
        : assignment?.kind === "general"
          ? "Acceso general"
          : null;

  const qrUnavailableMessage = !hasQr
    ? "Esta actividad no utiliza QR. El PDF es un comprobante de reservación."
    : isActive
      ? "El código QR de este boleto aún no está disponible."
      : "Este boleto no tiene un código QR de acceso activo.";

  return (
    <section className="mx-auto min-w-0 max-w-6xl space-y-8">
      <header className="space-y-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 font-semibold text-eventos-body-text transition-colors hover:text-eventos-primary focus-visible:outline-2 focus-visible:outline-eventos-primary"
        >
          <ArrowLeft size={20} aria-hidden="true" />
          Volver
        </button>

        <h1 className="font-merriweather text-3xl font-bold">
          Boleto Digital
        </h1>
      </header>

      <div className="grid min-w-0 grid-cols-1 items-center gap-6 rounded-xl border border-eventos-neutral bg-white p-4 sm:p-6 md:grid-cols-2 md:gap-10 md:p-10">
        {/* Ticket information */}
        <div className="min-w-0 space-y-6">
          <div className="space-y-2">
            <h2 className="break-words font-merriweather text-2xl font-bold text-secondary">
              {eventName}
            </h2>

            {subEventName && (
              <p className="font-merriweather text-lg">
                {subEventName}
              </p>
            )}

            <Badge variant={statusVariants[status]}>
              {statusLabels[status]}
            </Badge>
          </div>

          <dl className="space-y-4 text-sm">
            <div>
              <dt className="font-semibold">Fecha</dt>
              <dd>{date}</dd>
            </div>

            <div>
              <dt className="font-semibold">Horario</dt>
              <dd>
                {startTime} - {endTime} hrs
              </dd>
            </div>

            <div>
              <dt className="font-semibold">Nombre</dt>
              <dd>{attendeeName}</dd>
            </div>

            <div>
              <dt className="font-semibold">Espacio del evento</dt>
              <dd>{venue}</dd>
            </div>

            {assignmentText && (
              <div>
                <dt className="font-semibold">Lugar asignado</dt>
                <dd>{assignmentText}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* QR code */}
        {hasQr ? (
          <QRDisplay
            imageUrl={qrImageUrl}
            isUsable={isActive}
            unavailableMessage={qrUnavailableMessage}
          />
        ) : (
          <p
            role="status"
            className="rounded-lg border border-eventos-divider bg-eventos-muted-surface px-4 py-3 text-center text-sm text-eventos-muted-text"
          >
            {qrUnavailableMessage}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
        {isActive && onDownloadPdf && (
          <Button
            text="Descargar PDF"
            fullWidth
            className="min-w-0 whitespace-normal sm:w-auto"
            loading={isDownloadingPdf}
            loadingText="Generando PDF..."
            onClick={onDownloadPdf}
          />
        )}

        {isActive && onPreviewPdf && (
          <Button
            text="Vista previa"
            fullWidth
            className="min-w-0 whitespace-normal sm:w-auto"
            variant="outline"
            loading={isLoadingPreview}
            loadingText="Abriendo PDF..."
            onClick={onPreviewPdf}
          />
        )}

        <Button
          text="Volver"
          fullWidth
          className="col-span-2 sm:w-auto"
          variant="outline"
          onClick={onBack}
        />
      </div>
      {downloadError && !previewUrl && (
        <p role="alert" className="text-sm text-eventos-error-strong">
          {downloadError}
        </p>
      )}
      {previewUrl && onClosePreview && onDownloadPdf && (
        <TicketPdfPreviewDialog
          url={previewUrl}
          onClose={onClosePreview}
          onDownload={onDownloadPdf}
          isDownloading={isDownloadingPdf}
          error={downloadError}
        />
      )}
    </section>
  );
}

export default DigitalTicketView;