import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Button } from "../../../../components/atoms/Button/Button";

export interface TicketPdfPreviewDialogProps {
  url: string;
  onClose: () => void;
  onDownload: () => void;
  isDownloading: boolean;
  error?: string | null;
}

export function TicketPdfPreviewDialog({
  url,
  onClose,
  onDownload,
  isDownloading,
  error,
}: TicketPdfPreviewDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="ticket-pdf-preview-title"
      onClose={onClose}
      onCancel={onClose}
      className="fixed inset-0 m-auto w-[min(95vw,950px)] max-w-none rounded-xl border border-eventos-divider bg-eventos-on-primary p-0 text-eventos-body-text shadow-2xl backdrop:bg-eventos-ink/70"
    >
      <div className="flex items-center justify-between gap-3 border-b border-eventos-divider px-4 py-3 sm:px-6">
        <h2 id="ticket-pdf-preview-title" className="text-lg font-bold">
          Vista previa del boleto en PDF
        </h2>
        <button
          type="button"
          aria-label="Cerrar vista previa"
          onClick={onClose}
          className="rounded-md p-2 text-eventos-body-text hover:bg-eventos-muted-surface focus-visible:outline-2 focus-visible:outline-eventos-primary"
        >
          <X size={22} aria-hidden="true" />
        </button>
      </div>
      <iframe
        title="Documento PDF del boleto"
        src={url}
        className="h-[60vh] min-h-64 w-full bg-eventos-muted-surface sm:h-[68vh]"
      />
      <div className="flex flex-col gap-3 border-t border-eventos-divider px-4 py-3 sm:flex-row sm:items-center sm:justify-end sm:px-6">
        <Button text="Cerrar" fullWidth className="sm:w-auto" variant="outline" onClick={onClose} />
        <Button
          text="Descargar PDF"
          fullWidth
          className="sm:w-auto"
          loading={isDownloading}
          loadingText="Descargando..."
          onClick={onDownload}
        />
      </div>
      {error && (
        <p role="alert" className="px-4 pb-3 text-sm text-eventos-error-strong sm:px-6">
          {error}
        </p>
      )}
    </dialog>
  );
}
