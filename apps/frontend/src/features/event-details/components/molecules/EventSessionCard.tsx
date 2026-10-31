import {
  CalendarDays,
  Clock3,
  MapPin,
  UsersRound,
} from "lucide-react";

import { Button } from "../../../../components/atoms/Button/Button";

import type {
  EventActivityViewModel,
} from "../../types/eventDetails.types";

export interface EventSessionCardProps {
  activity: EventActivityViewModel;
  onViewDetails: (idSubEvento: number) => void;
}

function formatDate(date: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(date);

  if (!match) {
    return date;
  }

  const [, year, month, day] = match;

  return `${day}/${month}/${year.slice(2)}`;
}

function formatTime(time: string): string {
  return time.slice(0, 5);
}

export function EventSessionCard({
                                   activity,
                                   onViewDetails,
                                 }: EventSessionCardProps) {
  const {
    idSubEvento,
    nombre,
    fecha,
    horaInicio,
    horaFin,
    recinto,
    lugaresDisponibles,
  } = activity;

  const availableText =
    lugaresDisponibles === null
      ? "Por consultar"
      : `${lugaresDisponibles}/${recinto.aforo}`;

  return (
    <article
      className="
        grid grid-cols-1 items-center gap-5
        rounded-md bg-eventos-primary-light
        px-6 py-5
        md:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)_auto]
      "
    >
      {/* Nombre de la actividad */}
      <div className="min-w-0 text-center">
        <h3
          className="
            font-merriweather text-lg font-semibold
            text-gray-950
          "
        >
          {nombre}
        </h3>
      </div>

      {/* Información general */}
      <div className="min-w-0 space-y-2">
        <div className="flex items-start gap-2">
          <CalendarDays
            size={19}
            className="mt-0.5 shrink-0"
            aria-hidden="true"
          />

          <p className="text-sm">
            <span className="font-semibold">Fecha:</span>{" "}
            {formatDate(fecha)}
          </p>
        </div>

        <div className="flex items-start gap-2">
          <MapPin
            size={19}
            className="mt-0.5 shrink-0"
            aria-hidden="true"
          />

          <p className="text-sm">
            <span className="font-semibold">Espacio:</span>{" "}
            {recinto.nombre}
          </p>
        </div>

        <div className="flex items-start gap-2">
          <Clock3
            size={19}
            className="mt-0.5 shrink-0"
            aria-hidden="true"
          />

          <p className="text-sm">
            <span className="font-semibold">Horario:</span>{" "}
            {formatTime(horaInicio)}-
            {formatTime(horaFin)}
          </p>
        </div>

        <div className="flex items-start gap-2">
          <UsersRound
            size={19}
            className="mt-0.5 shrink-0"
            aria-hidden="true"
          />

          <p className="text-sm">
            <span className="font-semibold">
              Cupos restantes:
            </span>{" "}
            {availableText}
          </p>
        </div>
      </div>

      {/* Navegación a UI05.1 */}
      <div className="flex justify-center">
        <Button
          type="button"
          text="Ver detalles"
          variant="primary"
          size="md"
          className="whitespace-nowrap"
          aria-label={`Ver detalles de ${nombre}`}
          onClick={() => onViewDetails(idSubEvento)}
        />
      </div>
    </article>
  );
}

export default EventSessionCard;