import { AlertCircle, LoaderCircle } from "lucide-react";
import { Link } from "react-router";
import { getCurrentUserHomePath } from "../../../../lib/userNavigation";

import type {
  EventDetailsLoadStatus,
} from "../../hooks/useEventDetails";

interface EventDetailsRequestStateProps {
  status: EventDetailsLoadStatus;
  error: string | null;
  onRetry: () => void;
  returnUrl?: string;
}

export function EventDetailsRequestState({
                                           status,
                                           error,
                                           onRetry,
                                           returnUrl,
                                         }: EventDetailsRequestStateProps) {
  const homePath = getCurrentUserHomePath();
  if (status === "loading") {
    return (
      <section
        role="status"
        aria-live="polite"
        className="flex min-h-[350px] flex-col items-center justify-center gap-4"
      >
        <LoaderCircle
          size={40}
          className="animate-spin text-eventos-primary"
          aria-hidden="true"
        />

        <p className="text-eventos-muted-text">
          Cargando detalles del evento...
        </p>
      </section>
    );
  }

  const messages: Record<
    Exclude<EventDetailsLoadStatus, "loading" | "success">,
    string
  > = {
    "not-found": "El evento o actividad solicitado no existe.",
    forbidden: "No tienes permiso para consultar este evento.",
    invalid: "El identificador proporcionado no es válido.",
    error: "Ocurrió un problema al cargar la información.",
  };

  const message =
    status === "success"
      ? messages.error
      : messages[status];

  return (
    <section
      role="alert"
      className="mx-auto flex min-h-[350px] max-w-xl flex-col items-center justify-center gap-5 px-5 text-center"
    >
      <AlertCircle
        size={48}
        className="text-eventos-primary"
        aria-hidden="true"
      />

      <h1 className="font-merriweather text-2xl font-semibold">
        No fue posible mostrar los detalles
      </h1>

      <p className="text-eventos-muted-text">
        {error || message}
      </p>

      <div className="flex flex-wrap justify-center gap-4">
        {status === "error" && (
          <button
            type="button"
            onClick={onRetry}
            className="rounded-lg bg-eventos-primary px-6 py-3 font-semibold text-eventos-on-primary hover:bg-eventos-action-hover"
          >
            Reintentar
          </button>
        )}

        {status === "forbidden" && (
          <Link
            to="/login"
            state={returnUrl ? { returnUrl } : undefined}
            className="rounded-lg bg-eventos-primary px-6 py-3 font-semibold text-eventos-on-primary hover:bg-eventos-action-hover"
          >
            Iniciar sesión
          </Link>
        )}

        {homePath && (
          <Link
            to={homePath}
            className="rounded-lg border border-eventos-primary px-6 py-3 font-semibold text-eventos-primary hover:bg-eventos-action-hover-soft"
          >
            Volver al menú
          </Link>
        )}
      </div>
    </section>
  );
}