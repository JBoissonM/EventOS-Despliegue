import {
  CalendarDays,
  Clock3,
  MapPin,
  UsersRound,
} from "lucide-react";

import { EstadoSubEvento } from "@eventos/shared";

import type {
  EventActivityViewModel,
} from "../../types/eventDetails.types";

export interface ReservationInfoCardProps {
  activity: EventActivityViewModel;
  kind?: "evento" | "actividad";
  isSubmitting?: boolean;
  onReserve: (idSubEvento: number) => void;
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

export function ReservationInfoCard({
                                      activity,
                                      kind = "evento",
                                      isSubmitting = false,
                                      onReserve,
                                    }: ReservationInfoCardProps) {
  const {
    idSubEvento,
    fecha,
    horaInicio,
    horaFin,
    recinto,
    lugaresDisponibles,
    estado,
    estadoReservaUsuario,
  } = activity;

  const isReserved = estadoReservaUsuario === "reservado";

  const isApproved = estado === EstadoSubEvento.ACEPTADO;

  const reservationIsKnown =
    estadoReservaUsuario !== "desconocido";

  const availabilityIsKnown =
    lugaresDisponibles !== null;

  const hasAvailability =
    availabilityIsKnown && lugaresDisponibles > 0;

  const canReserve =
    !isReserved &&
    isApproved &&
    reservationIsKnown &&
    hasAvailability &&
    !isSubmitting;

  const reservationTitle =
    kind === "actividad"
      ? "Actividad Reservada"
      : "Evento Reservado";

  const availabilityText =
    lugaresDisponibles === null
      ? "Por consultar"
      : String(Math.max(0, lugaresDisponibles));

  return (
    <section
      aria-label="Información de reservación"
      className="
        flex min-h-[350px] w-full flex-col
        rounded-md border border-[#255E67]
        bg-[#F7F5F5] p-5
        sm:min-h-[415px]
      "
    >
      {/* Datos de la actividad */}
      <dl className="space-y-5">
        <div className="flex items-start gap-3">
          <CalendarDays
            size={25}
            className="shrink-0"
            aria-hidden="true"
          />

          <div className="flex flex-wrap gap-1">
            <dt className="font-semibold">Fecha:</dt>
            <dd>{formatDate(fecha)}</dd>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <MapPin
            size={25}
            className="shrink-0"
            aria-hidden="true"
          />

          <div className="flex flex-wrap gap-1">
            <dt className="font-semibold">Espacio:</dt>
            <dd>{recinto.nombre}</dd>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Clock3
            size={25}
            className="shrink-0"
            aria-hidden="true"
          />

          <div className="flex flex-wrap gap-1">
            <dt className="font-semibold">Horario:</dt>
            <dd>
              {formatTime(horaInicio)}-
              {formatTime(horaFin)} hrs
            </dd>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <UsersRound
            size={25}
            className="shrink-0"
            aria-hidden="true"
          />

          <div className="flex flex-wrap gap-1">
            <dt className="font-semibold">
              Cupos restantes:
            </dt>
            <dd>{availabilityText}</dd>
          </div>
        </div>
      </dl>

      {/* Estado y acción de reservación */}
      <div
        aria-live="polite"
        className="
          mt-10 flex flex-1 flex-col
          items-center justify-center
          text-center
        "
      >
        {isReserved ? (
          <p className="font-merriweather text-2xl font-semibold">
            {reservationTitle}
          </p>
        ) : !isApproved ? (
          <p className="text-lg font-semibold text-gray-600">
            Reservación no disponible
          </p>
        ) : !reservationIsKnown ? (
          <p className="text-sm text-gray-600">
            Comprobando reservación...
          </p>
        ) : !availabilityIsKnown ? (
          <p className="text-sm text-gray-600">
            Consultando disponibilidad...
          </p>
        ) : !hasAvailability ? (
          <p className="text-lg font-semibold text-gray-600">
            Sin lugares disponibles
          </p>
        ) : (
          <button
            type="button"
            disabled={!canReserve}
            aria-busy={isSubmitting}
            onClick={() => onReserve(idSubEvento)}
            className="
              rounded-xl bg-[#5F1B36]
              px-7 py-5
              font-merriweather text-xl
              font-semibold text-white
              transition-opacity
              hover:opacity-90
              focus-visible:outline-2
              focus-visible:outline-offset-2
              focus-visible:outline-[#5F1B36]
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            {isSubmitting
              ? "Procesando..."
              : "Reservar Lugar"}
          </button>
        )}
      </div>
    </section>
  );
}

export default ReservationInfoCard;