import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { DigitalTicketView } from "../components/organisms/DigitalTicketView";
import { TicketPdfPreviewDialog } from "../components/molecules/TicketPdfPreviewDialog";
import { ticketsService } from "../services/tickets.service";
import type { TicketDetailResponse } from "../services/tickets.service";
import { mapTicketStatus } from "../utils/mapTicketsStatus";
import { formatEventDate } from "../../event-details/utils/formatEventDate";
import { ApiError } from "../../../lib/apiClient";

function getSessionName(): string | undefined {
  try {
    const user = JSON.parse(localStorage.getItem("usuario") || "{}") as {
      nombre?: string;
      apellidoPa?: string;
      apellidoMa?: string;
    };
    const name = [user.nombre, user.apellidoPa, user.apellidoMa].filter(Boolean).join(" ").trim();
    return name || undefined;
  } catch {
    return undefined;
  }
}

export function DigitalTicketRoute() {
  const { idBoleto } = useParams();

  return <DigitalTicketContent key={idBoleto} idBoleto={idBoleto} />;
}

function DigitalTicketContent({ idBoleto }: { idBoleto?: string }) {
  const navigate = useNavigate();
  const id = Number(idBoleto);
  const validId = Number.isSafeInteger(id) && id > 0;
  const [detail, setDetail] = useState<TicketDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const previewUrlRef = useRef<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    };
  }, []);

  async function previewPdf() {
    if (!validId || isLoadingPreview || previewUrlRef.current) return;
    setPdfError(null);
    setIsLoadingPreview(true);
    try {
      const pdf = await ticketsService.downloadTicketPdf(id);
      if (!mountedRef.current) return;
      const url = URL.createObjectURL(pdf);
      previewUrlRef.current = url;
      setPreviewUrl(url);
    } catch (cause) {
      if (mountedRef.current) {
        setPdfError(cause instanceof Error ? cause.message : "No fue posible abrir la vista previa.");
      }
    } finally {
      if (mountedRef.current) setIsLoadingPreview(false);
    }
  }

  function closePreview() {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = null;
    setPreviewUrl(null);
  }

  async function downloadPdf() {
    if (!validId || isDownloadingPdf) return;
    setPdfError(null);
    setIsDownloadingPdf(true);
    try {
      const pdf = await ticketsService.downloadTicketPdf(id);
      const url = URL.createObjectURL(pdf);
      const link = document.createElement("a");
      link.href = url;
      link.download = `eventos-boleto-${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 15000);
    } catch (cause) {
      if (mountedRef.current) {
        setPdfError(cause instanceof Error ? cause.message : "No fue posible descargar el boleto.");
      }
    } finally {
      if (mountedRef.current) setIsDownloadingPdf(false);
    }
  }


  useEffect(() => {
    if (!validId) return;
    let active = true;
    setLoading(true);
    setDetail(null);
    setError(null);
    setErrorStatus(null);
    void ticketsService.getTicketDetail(id)
      .then((result) => {
        if (!active) return;
        setDetail(result);
        setLoading(false);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        const code = cause instanceof ApiError ? cause.status : null;
        setErrorStatus(code);
        const requiereLogin =
          code === 401 ||
          (code === 403 && !localStorage.getItem("token"));
        setError(
          requiereLogin
            ? "Tu sesión no está disponible o no es válida. Inicia sesión para consultar tu boleto."
            : code === 403 || code === 404
              ? "No tienes acceso a este boleto o no existe."
              : "No fue posible consultar este boleto. Intenta nuevamente.",
        );
        setLoading(false);
      });
    return () => { active = false; };
  }, [id, validId, revision]);

  if (!validId) {
    return <div role="alert" className="mx-auto max-w-xl py-12 text-center text-eventos-error">Identificador de boleto no válido. <Link className="text-eventos-primary underline" to="/asistente/boletos">Volver a Mis Boletos</Link></div>;
  }

  if (loading) {
    return <p role="status" className="mx-auto max-w-6xl py-16 text-center text-eventos-muted-text">Cargando boleto digital...</p>;
  }

  if (error || !detail) {
    const requiereLogin =
      errorStatus === 401 ||
      (errorStatus === 403 && !localStorage.getItem("token"));
    return (
      <div className="mx-auto max-w-xl space-y-4 rounded-xl border border-eventos-panel-border bg-eventos-surface p-8 text-center">
        <p role="alert" className="text-eventos-error">{error ?? "No fue posible consultar este boleto."}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <button type="button" onClick={() => setRevision((value) => value + 1)} className="rounded-lg bg-eventos-primary px-4 py-2 font-semibold text-eventos-on-primary">Reintentar</button>
          <Link to={requiereLogin ? "/login" : "/asistente/boletos"} className="rounded-lg border border-eventos-primary px-4 py-2 font-semibold text-eventos-primary">{requiereLogin ? "Iniciar sesión" : "Mis Boletos"}</Link>
        </div>
      </div>
    );
  }

  const status = mapTicketStatus(detail.estadoBoleto);
  const qrValue = typeof detail.qr === "string" ? detail.qr.trim() : "";
  const qrImageUrl = qrValue.startsWith("data:image/png;base64,")
    ? qrValue
    : qrValue.length > 0 && /^[A-Za-z0-9+/]+={0,2}$/.test(qrValue)
      ? `data:image/png;base64,${qrValue}`
      : null;
  const assignment = detail.asiento
    ? { kind: "seat" as const, label: `${detail.asiento.fila}${detail.asiento.numero}` }
    : { kind: "general" as const };

  return (
    <div className="space-y-4">
      <DigitalTicketView
        eventName={detail.evento.nombre}
        subEventName={detail.subEvento.nombre}
        date={formatEventDate(detail.subEvento.fecha)}
        startTime={detail.subEvento.horaInicio?.slice(0, 5) ?? "--:--"}
        endTime={detail.subEvento.horaFin?.slice(0, 5) ?? "--:--"}
        venue={detail.recinto.nombre}
        attendeeName={getSessionName()}
        status={status}
        assignment={assignment}
        qrImageUrl={qrImageUrl}
        onBack={() => navigate("/asistente/boletos")}
        onPreviewPdf={() => void previewPdf()}
        onDownloadPdf={() => void downloadPdf()}
        isLoadingPreview={isLoadingPreview}
        isDownloadingPdf={isDownloadingPdf}
      />
      {pdfError && (
        <p role="alert" className="text-center text-sm text-eventos-error">{pdfError}</p>
      )}
      {previewUrl && (
        <TicketPdfPreviewDialog
          url={previewUrl}
          onClose={closePreview}
          onDownload={() => void downloadPdf()}
          isDownloading={isDownloadingPdf}
          error={pdfError}
        />
      )}
    </div>
  );
}
