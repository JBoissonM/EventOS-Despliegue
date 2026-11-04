import { AlertCircle, LoaderCircle } from "lucide-react";
import { Link, useLocation } from "react-router";
import { getAuthPathWithReturnUrl } from "../../utils/eventReturnUrl";
import type { EventDetailsLoadStatus } from "../../hooks/useEventDetails";

interface EventDetailsRequestStateProps {
  status: EventDetailsLoadStatus;
  error: string | null;
  onRetry: () => void;
}

export function EventDetailsRequestState({ status, error, onRetry }: EventDetailsRequestStateProps) {
  const location = useLocation();
  const loginPath = getAuthPathWithReturnUrl("/login", location.pathname);
  if (status === "loading") {
    return (
      <section role="status" aria-live="polite" className="mx-auto flex min-h-80 max-w-5xl flex-col items-center justify-center gap-4">
        <LoaderCircle className="animate-spin text-eventos-primary" size={36} aria-hidden="true" />
        <p className="text-eventos-muted-text">Cargando detalles del evento...</p>
      </section>
    );
  }

  const message = status === "not-found"
    ? "No encontramos el evento o la actividad solicitada."
    : status === "forbidden"
      ? "No tienes permiso para consultar este evento. Si corresponde, inicia sesión."
      : status === "invalid"
        ? "El enlace del evento no es válido."
        : "No fue posible cargar los detalles del evento.";

  return (
    <section role="alert" className="mx-auto flex min-h-80 max-w-5xl flex-col items-center justify-center gap-4 rounded-lg border border-eventos-divider bg-eventos-panel-surface p-6 text-center">
      <AlertCircle size={34} className="text-eventos-error-strong" aria-hidden="true" />
      <p className="font-semibold text-eventos-ink">{message}</p>
      {status === "error" && error && <p className="text-sm text-eventos-muted-text">{error}</p>}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {status === "error" && (
          <button type="button" onClick={onRetry} className="rounded-md bg-eventos-primary px-5 py-2 font-semibold text-eventos-on-primary hover:bg-eventos-action-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-eventos-primary">Reintentar</button>
        )}
        {status === "forbidden" && <Link to={loginPath} className="rounded-md bg-eventos-primary px-5 py-2 font-semibold text-eventos-on-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-eventos-primary">Iniciar sesión</Link>}
        <Link to="/cartelera" className="rounded-md border border-eventos-panel-border px-5 py-2 font-semibold text-eventos-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-eventos-primary">Volver a la cartelera</Link>
      </div>
    </section>
  );
}
