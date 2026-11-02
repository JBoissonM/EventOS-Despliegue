import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { DigitalTicketView } from "../components/organisms/DigitalTicketView";
import { ticketsService } from "../services/tickets.service";
import type { TicketDetailResponse } from "../services/tickets.service";
import { mapTicketStatus } from "../utils/mapTicketsStatus";
import { formatEventDate } from "../../event-details/utils/formatEventDate";

function getAttendeeName(): string {
  try {
    const user = JSON.parse(localStorage.getItem("usuario") || "{}") as {
      nombre?: string;
      apellidoPa?: string;
      apellidoMa?: string;
    };
    return [user.nombre, user.apellidoPa, user.apellidoMa].filter(Boolean).join(" ") || "Asistente";
  } catch {
    return "Asistente";
  }
}

export function DigitalTicketRoute() {
  const { idBoleto } = useParams();
  const navigate = useNavigate();
  const ticketId = Number(idBoleto);
  const validId = Number.isSafeInteger(ticketId) && ticketId > 0;
  const [detail, setDetail] = useState<TicketDetailResponse | null>(null);
  const [state, setState] = useState<"loading" | "success" | "error">("loading");
  const [refreshCount, setRefreshCount] = useState(0);
  const [pdfState, setPdfState] = useState<"idle" | "downloading">("idle");
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
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
    if (!validId || !detail || isLoadingPreview || previewUrlRef.current) return;
    setIsLoadingPreview(true);
    setPdfError(null);
    try {
      const pdf = await ticketsService.downloadTicketPdf(ticketId);
      if (!mountedRef.current) return;
      const url = URL.createObjectURL(pdf);
      previewUrlRef.current = url;
      setPreviewUrl(url);
    } catch (error) {
      if (mountedRef.current) {
        setPdfError(error instanceof Error ? error.message : "No fue posible abrir la vista previa.");
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
    if (!validId || !detail || pdfState === "downloading") return;
    setPdfState("downloading");
    setPdfError(null);
    try {
      const pdf = await ticketsService.downloadTicketPdf(ticketId);
      const url = URL.createObjectURL(pdf);
      const link = document.createElement("a");
      link.href = url;
      link.download = `eventos-boleto-${ticketId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 15000);
    } catch (error) {
      setPdfError(error instanceof Error ? error.message : "No fue posible descargar el boleto.");
    } finally {
      setPdfState("idle");
    }
  }

  useEffect(() => {
    if (!validId) return;
    let current = true;
    setState("loading");
    setDetail(null);

    void ticketsService.getTicketDetail(ticketId)
      .then((result) => {
        if (!current) return;
        setDetail(result);
        setState("success");
      })
      .catch(() => {
        if (!current) return;
        setState("error");
      });

    return () => { current = false; };
  }, [ticketId, validId, refreshCount]);

  if (!validId) {
    return <p role="alert" className="py-10 text-center">Identificador de boleto no válido.</p>;
  }

  if (state === "loading") {
    return <p role="status" className="py-12 text-center text-eventos-muted-text">Cargando boleto digital...</p>;
  }

  if (state === "error" || !detail) {
    return (
      <div role="alert" className="mx-auto max-w-xl space-y-4 rounded-lg border border-eventos-divider p-8 text-center">
        <p>No fue posible consultar este boleto. Verifica tu sesión e inténtalo de nuevo.</p>
        <div className="flex justify-center gap-4">
          <button type="button" onClick={() => setRefreshCount((count) => count + 1)} className="rounded-md bg-eventos-primary px-4 py-2 text-eventos-on-primary">Reintentar</button>
          <Link to="/asistente/boletos" className="rounded-md border border-eventos-primary px-4 py-2 text-eventos-primary">Mis boletos</Link>
        </div>
      </div>
    );
  }

  const status = mapTicketStatus(detail.estadoBoleto);
  const qrImageUrl = typeof detail.qr === "string" && detail.qr.startsWith("data:image/png;base64,")
    ? detail.qr
    : null;
  const assignment = detail.asiento
    ? { kind: "seat" as const, label: `${detail.asiento.fila}${detail.asiento.numero}` }
    : undefined;

  return (
    <DigitalTicketView
      eventName={detail.evento.nombre}
      subEventName={detail.subEvento.nombre}
      date={formatEventDate(detail.subEvento.fecha)}
      startTime={detail.subEvento.horaInicio.slice(0, 5)}
      endTime={detail.subEvento.horaFin.slice(0, 5)}
      venue={detail.recinto.nombre}
      attendeeName={getAttendeeName()}
      status={status}
      assignment={assignment}
      qrImageUrl={qrImageUrl}
      hasQr={detail.subEvento.accesoQR}
      onBack={() => navigate("/asistente/boletos")}
      onDownloadPdf={() => void downloadPdf()}
      onPreviewPdf={() => void previewPdf()}
      isLoadingPreview={isLoadingPreview}
      previewUrl={previewUrl}
      onClosePreview={closePreview}
      isDownloadingPdf={pdfState === "downloading"}
      downloadError={pdfError}
    />
  );
}
