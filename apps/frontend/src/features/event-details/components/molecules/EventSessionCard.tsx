import { CalendarDays, Clock3, MapPin, UsersRound } from "lucide-react";
import { Link } from "react-router";
import Button from "../../../../components/atoms/Button/Button";
import { useReservationAvailability } from "../../../reservations/hooks/useReservationAvailability";
import type { EventActivityViewModel } from "../../types/eventDetails.types";
import { formatEventDate } from "../../utils/formatEventDate";

interface EventSessionCardProps {
  activity: Pick<
    EventActivityViewModel,
    "idSubEvento" | "idEvento" | "nombre" | "accesoQR" | "fecha" | "recinto"
  >;
  detailsPath?: string;
  detailsLabel?: string;
  actionLabel?: string;
  actionVariant?: "primary" | "secondary" | "outline" | "danger" | "success";
  onAction?: () => void;
}

export function EventSessionCard({
  activity,
  detailsPath,
  detailsLabel = "Ver detalles",
  actionLabel,
  actionVariant = "danger",
  onAction,
}: EventSessionCardProps) {
  const { availability, isLoading, error } = useReservationAvailability(
    activity.idSubEvento,
  );
  const cupos =
    availability?.idSubEvento === activity.idSubEvento
      ? availability.lugaresDisponibles
      : null;
  return (
    <article className="grid w-full grid-cols-1 items-center gap-6 rounded-md bg-eventos-primary-light px-5 py-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)_auto]">
      <div className="min-w-0 text-center">
        <h3 className="font-merriweather text-lg font-semibold text-eventos-ink">
          {activity.nombre}
        </h3>
        <p className="mt-2 text-sm font-medium text-eventos-secondary">
          {activity.accesoQR ? "Con boleto QR" : "Entrada libre"}
        </p>
      </div>
      <dl className="min-w-0 space-y-3 text-sm text-eventos-body-text">
        <div className="flex items-start gap-2"><CalendarDays size={19} aria-hidden="true"/><dt className="font-semibold">Fecha:</dt><dd>{formatEventDate(activity.fecha?.fecha)}</dd></div>
        <div className="flex items-start gap-2"><MapPin size={19} aria-hidden="true"/><dt className="font-semibold">Espacio:</dt><dd>{activity.recinto?.nombre ?? "Por confirmar"}</dd></div>
        <div className="flex items-start gap-2"><Clock3 size={19} aria-hidden="true"/><dt className="font-semibold">Horario:</dt><dd>{activity.fecha ? `${activity.fecha.horaInicio.slice(0,5)}–${activity.fecha.horaFin.slice(0,5)} hrs` : "Por confirmar"}</dd></div>
        <div className="flex items-start gap-2"><UsersRound size={19} aria-hidden="true"/><dt className="font-semibold">Cupos restantes:</dt><dd aria-live="polite">{isLoading ? "Consultando..." : error || cupos === null ? "Por confirmar" : `${cupos}/${activity.recinto?.aforo ?? "?"}`}</dd></div>
      </dl>
      {onAction ? (
        <Button
          text={actionLabel ?? "Ver detalles"}
          type="button"
          variant={actionVariant}
          className="justify-self-center whitespace-nowrap rounded-md px-5 py-3 text-sm md:-translate-x-6"
          onClick={onAction}
        />
      ) : (
        <Link to={detailsPath ?? `/eventos/${activity.idEvento}/actividades/${activity.idSubEvento}`} className="justify-self-center whitespace-nowrap rounded-md bg-eventos-primary px-5 py-3 text-sm font-semibold text-eventos-on-primary hover:bg-eventos-action-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-eventos-primary md:-translate-x-6">{detailsLabel}</Link>
      )}
    </article>
  );
}
