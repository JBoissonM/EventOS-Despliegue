import { CalendarDays, Clock3, MapPin, UsersRound } from "lucide-react";
import { Link } from "react-router";
import { useReservationAvailability } from "../../../reservations/hooks/useReservationAvailability";
import type { EventActivityViewModel } from "../../types/eventDetails.types";
import { getAuthPathWithReturnUrl } from "../../utils/eventReturnUrl";
import { formatEventDate } from "../../utils/formatEventDate";

interface ActivityInformationCardProps {
  activity: EventActivityViewModel;
  returnPath: string;
}

export function ActivityInformationCard({ activity, returnPath }: ActivityInformationCardProps) {
  const { availability, isLoading, error, refresh } = useReservationAvailability(activity.idSubEvento);
  const cupos = availability?.idSubEvento === activity.idSubEvento ? availability.lugaresDisponibles : null;
  const hasSession = Boolean(localStorage.getItem("token"));
  const currentAvailability = availability?.idSubEvento === activity.idSubEvento ? availability : null;
  const backendAllowsReservation = currentAvailability !== null
    && "permiteReservar" in currentAvailability
    && currentAvailability.permiteReservar === true;
  const backendDeniesReservation = currentAvailability !== null
    && "permiteReservar" in currentAvailability
    && currentAvailability.permiteReservar === false;
  const canReserve = !isLoading && !error && backendAllowsReservation
    && currentAvailability !== null && currentAvailability.lugaresDisponibles > 0;
  const noAvailability = !isLoading && !error && currentAvailability !== null
    && (backendDeniesReservation || currentAvailability.lugaresDisponibles <= 0);
  const loginPath = getAuthPathWithReturnUrl("/login", returnPath);

  const data = [
    { label: "Fecha", value: formatEventDate(activity.fecha?.fecha), Icon: CalendarDays },
    { label: "Espacio", value: activity.recinto?.nombre ?? "Por confirmar", Icon: MapPin },
    { label: "Horario", value: activity.fecha ? `${activity.fecha.horaInicio.slice(0, 5)}–${activity.fecha.horaFin.slice(0, 5)} hrs` : "Por confirmar", Icon: Clock3 },
    { label: "Cupos restantes", value: cupos !== null ? `${cupos}/${activity.recinto?.aforo ?? "?"}` : "Por confirmar", Icon: UsersRound },
  ];

  return (
    <section aria-label="Información de la actividad" className="flex min-h-80 w-full flex-col rounded-md border border-eventos-panel-border bg-eventos-panel-surface p-5 sm:p-7">
      <p className="mb-6 self-start rounded-full bg-eventos-secondary-light px-3 py-1 text-sm font-semibold text-eventos-secondary">
        {activity.accesoQR ? "Acceso con boleto QR" : "Entrada libre"}
      </p>
      <dl className="space-y-5 text-eventos-body-text">
        {data.map(({ label, value, Icon }) => (
          <div key={label} className="flex items-start gap-3">
            <Icon size={22} className="shrink-0 text-eventos-secondary" aria-hidden="true" />
            <dt className="font-semibold">{label}:</dt>
            <dd className="min-w-0 break-words">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-8 space-y-3 text-center" aria-live="polite">
        {isLoading && <p className="text-sm text-eventos-muted-text">Consultando disponibilidad...</p>}
        {error && (
          <div className="space-y-2">
            <p className="text-sm text-eventos-error-strong">No se pudo consultar la disponibilidad.</p>
            <button type="button" onClick={refresh} className="rounded-md border border-eventos-primary px-4 py-2 font-semibold text-eventos-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-eventos-primary">Reintentar</button>
          </div>
        )}
        {!activity.accesoQR ? (
          <p className="rounded-md bg-eventos-secondary-light p-4 text-sm text-eventos-secondary">Acceso libre hasta completar el aforo del recinto.</p>
        ) : (
          <div className="rounded-md border border-eventos-warning bg-eventos-warning/20 p-4">
            <p className="font-semibold text-eventos-ink">Requiere reservación previa</p>
            <p className="mt-2 text-sm text-eventos-body-text">Esta actividad puede consultarse públicamente, pero para ingresar necesitas una reservación y un boleto QR válido.</p>
            {noAvailability && <p role="status" className="mt-3 text-sm font-semibold text-eventos-error-strong">No es posible realizar reservaciones para esta actividad en este momento.</p>}
            {canReserve && !hasSession && (
              <Link to={loginPath} className="mt-4 inline-flex min-h-11 items-center justify-center rounded-md bg-eventos-primary px-5 py-2 text-center text-sm font-semibold text-eventos-on-primary hover:bg-eventos-action-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-eventos-primary">
                Iniciar sesión para reservar
              </Link>
            )}
            {canReserve && hasSession && (
              <p className="mt-3 text-sm text-eventos-body-text">Tu sesión está iniciada. La opción para solicitar el boleto se habilitará al integrar el flujo de reservaciones.</p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
