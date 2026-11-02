import {
  CalendarDays,
  Clock3,
  MapPin,
  UsersRound,
} from "lucide-react";

import { EstadoSubEvento, ModalidadAcceso } from "@eventos/shared";

import { Button } from "../../../../components/atoms/Button/Button";

import type {
  EventActivityViewModel,
} from "../../types/eventDetails.types";

import { formatEventDate } from "../../utils/formatEventDate";

interface EventSessionCardProps {
  activity: EventActivityViewModel;
  onViewDetails: (idSubEvento: number) => void;
}

function formatSchedule(
  startTime: string | undefined,
  endTime: string | undefined,
): string {
  if (!startTime || !endTime) {
    return "Por confirmar";
  }

  return `${startTime.slice(0, 5)}–${endTime.slice(0, 5)} hrs`;
}

function getAvailabilityText(
  activity: EventActivityViewModel,
): string {
  if (activity.estado !== EstadoSubEvento.ACEPTADO) {
    return "No disponible";
  }

  const { estado, lugaresDisponibles } =
    activity.disponibilidad;

  if (estado === "error") {
    return "No se pudo consultar";
  }

  if (estado === "pendiente" || estado === "cargando") {
    return "Consultando...";
  }

  if (lugaresDisponibles === null) {
    return "Por confirmar";
  }

  const aforo = activity.recinto?.aforo;

  if (aforo === undefined) {
    return String(lugaresDisponibles);
  }

  return `${lugaresDisponibles}/${aforo}`;
}

export function EventSessionCard({
                                   activity,
                                   onViewDetails,
                                 }: EventSessionCardProps) {
  const {
    idSubEvento,
    nombre,
    fecha,
    recinto,
    estado,
  } = activity;

  const availabilityText = getAvailabilityText(activity);

  return (
    <article
      className="
        grid w-full grid-cols-1 items-center
        gap-6 rounded-md bg-eventos-primary-light
        px-6 py-6
        md:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)_auto]
      "
    >
      <div className="min-w-0 text-center">
        <h3 className="font-merriweather text-lg font-semibold text-eventos-ink">
          {nombre}
        </h3>
        <p className="mt-2 text-sm font-semibold text-eventos-secondary">
          {activity.modalidadAcceso === ModalidadAcceso.ENTRADA_LIBRE ? "Entrada Libre" : "Con Reservación"}
        </p>

        {estado !== EstadoSubEvento.ACEPTADO && (
          <p className="mt-2 text-sm font-medium text-eventos-muted-text">
            Estado: {estado}
          </p>
        )}
      </div>

      <dl className="min-w-0 space-y-3">
        <div className="flex items-start gap-3">
          <CalendarDays
            size={20}
            className="shrink-0"
            aria-hidden="true"
          />

          <div className="flex flex-wrap gap-x-1 text-sm">
            <dt className="font-semibold">Fecha:</dt>
            <dd>{formatEventDate(fecha?.fecha)}</dd>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <MapPin
            size={20}
            className="shrink-0"
            aria-hidden="true"
          />

          <div className="flex flex-wrap gap-x-1 text-sm">
            <dt className="font-semibold">Espacio:</dt>
            <dd>{recinto?.nombre ?? "Por confirmar"}</dd>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Clock3
            size={20}
            className="shrink-0"
            aria-hidden="true"
          />

          <div className="flex flex-wrap gap-x-1 text-sm">
            <dt className="font-semibold">Horario:</dt>
            <dd>
              {formatSchedule(
                fecha?.horaInicio,
                fecha?.horaFin,
              )}
            </dd>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <UsersRound
            size={20}
            className="shrink-0"
            aria-hidden="true"
          />

          <div className="flex flex-wrap gap-x-1 text-sm">
            <dt className="font-semibold">
              {activity.modalidadAcceso === ModalidadAcceso.ENTRADA_LIBRE ? "Aforo:" : "Cupos restantes:"}
            </dt>

            <dd aria-live="polite">
              {activity.modalidadAcceso === ModalidadAcceso.ENTRADA_LIBRE ? recinto?.aforo ?? "Por confirmar" : availabilityText}
            </dd>
          </div>
        </div>
      </dl>

      <div className="flex justify-center">
        <Button
          type="button"
          variant="primary"
          size="md"
          text="Ver detalles"
          className="whitespace-nowrap"
          aria-label={`Ver detalles de ${nombre}`}
          onClick={() => onViewDetails(idSubEvento)}
        />
      </div>
    </article>
  );
}