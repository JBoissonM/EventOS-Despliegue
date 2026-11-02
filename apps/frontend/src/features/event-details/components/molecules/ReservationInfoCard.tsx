import {
  CalendarDays,
  Clock3,
  MapPin,
  UsersRound,
} from "lucide-react";

import { EstadoSubEvento, ModalidadAcceso } from "@eventos/shared";

import type {
  EventActivityViewModel,
} from "../../types/eventDetails.types";

import { formatEventDate } from "../../utils/formatEventDate";

interface ReservationInfoCardProps {
  activity: EventActivityViewModel;
  kind?: "evento" | "actividad";
  isSubmitting?: boolean;
  error?: string | null;
  onReserve: (idSubEvento: number) => void;
  onRetryAvailability?: () => void;
  authenticationState?: "guest" | "authenticated" | "session-error";
  onLogin?: () => void;
}

function formatTime(time: string | undefined): string {
  return time ? time.slice(0, 5) : "";
}

export function ReservationInfoCard({
                                      activity,
                                      kind = "evento",
                                      isSubmitting = false,
                                      error = null,
                                      onReserve,
                                      onRetryAvailability,
  authenticationState = "authenticated",
  onLogin,
                                    }: ReservationInfoCardProps) {
  const {
    idSubEvento,
    fecha,
    recinto,
    estado,
    estadoReservaUsuario,
    disponibilidad,
    modalidadAcceso,
  } = activity;

  const isReserved = estadoReservaUsuario === "reservado";
  const isApproved = estado === EstadoSubEvento.ACEPTADO;

  const availabilityStatus = disponibilidad.estado;
  const availableSeats = disponibilidad.lugaresDisponibles;
  const allowsReservation = disponibilidad.permiteReservar;

  const isAvailabilityReady =
    availabilityStatus === "lista" &&
    availableSeats !== null;

  const canReserve =
    isApproved &&
    !isReserved &&
    estadoReservaUsuario === "sin-reserva" &&
    isAvailabilityReady &&
    availableSeats > 0 &&
    allowsReservation === true &&
    !isSubmitting;

  const schedule = fecha
    ? `${formatTime(fecha.horaInicio)}–${formatTime(fecha.horaFin)} hrs`
    : "Por confirmar";

  const availabilityText =
    availableSeats === null
      ? "Por consultar"
      : recinto
        ? `${availableSeats}/${recinto.aforo}`
        : String(availableSeats);

  const reservedTitle =
    kind === "evento"
      ? "Evento Reservado"
      : "Actividad Reservada";

  return (
    <section
      aria-label="Información de reservación"
      className="flex min-h-[350px] w-full flex-col rounded-md border border-eventos-panel-border bg-eventos-panel-surface p-5 sm:min-h-[415px]"
    >
      <p className="mb-5 inline-flex self-start rounded-full bg-eventos-secondary-light px-3 py-1 text-sm font-semibold text-eventos-secondary">
        Modalidad de acceso: {modalidadAcceso === ModalidadAcceso.ENTRADA_LIBRE ? "Entrada Libre" : "Con Reservación"}
      </p>
      <dl className="space-y-6">
        <div className="flex items-start gap-3">
          <CalendarDays
            size={25}
            className="shrink-0"
            aria-hidden="true"
          />

          <div className="flex flex-wrap gap-x-1">
            <dt className="font-semibold">Fecha:</dt>
            <dd>{formatEventDate(fecha?.fecha)}</dd>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <MapPin
            size={25}
            className="shrink-0"
            aria-hidden="true"
          />

          <div className="flex flex-wrap gap-x-1">
            <dt className="font-semibold">Espacio:</dt>
            <dd>{recinto?.nombre ?? "Por confirmar"}</dd>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Clock3
            size={25}
            className="shrink-0"
            aria-hidden="true"
          />

          <div className="flex flex-wrap gap-x-1">
            <dt className="font-semibold">Horario:</dt>
            <dd>{schedule}</dd>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <UsersRound
            size={25}
            className="shrink-0"
            aria-hidden="true"
          />

          <div className="flex flex-wrap gap-x-1">
            <dt className="font-semibold">
              {modalidadAcceso === ModalidadAcceso.ENTRADA_LIBRE ? "Aforo:" : "Cupos restantes:"}
            </dt>
            <dd>{modalidadAcceso === ModalidadAcceso.ENTRADA_LIBRE ? recinto?.aforo ?? "Por confirmar" : availabilityText}</dd>
          </div>
        </div>
      </dl>

      <div
        aria-live="polite"
        aria-atomic="true"
        className="mt-10 flex flex-1 flex-col items-center justify-center gap-4 text-center"
      >
        {!isApproved ? (
          <p className="text-lg font-semibold text-eventos-muted-text">
            Actividad no disponible
          </p>
        ) : modalidadAcceso === ModalidadAcceso.ENTRADA_LIBRE ? (
          <div className="w-full rounded-lg border border-eventos-panel-border bg-eventos-secondary-light p-4 text-left">
            <p className="font-semibold text-eventos-secondary">Entrada Libre</p>
            <p className="mt-2 text-sm text-eventos-secondary">
              Acceso por orden de llegada hasta completar el aforo del recinto.
            </p>
          </div>
        ) : isReserved ? (
          <p className="font-merriweather text-2xl font-semibold text-eventos-panel-border">
            {reservedTitle}
          </p>
        ) : availabilityStatus === "error" ? (
          <>
            <p role="alert" className="text-sm text-eventos-error-strong">
              {error ?? "No fue posible consultar la disponibilidad."}
            </p>
            {onRetryAvailability && (
              <button
                type="button"
                onClick={onRetryAvailability}
                className="rounded-lg border border-eventos-primary px-5 py-2 font-semibold text-eventos-primary hover:bg-eventos-action-hover-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-eventos-primary"
              >
                Reintentar
              </button>
            )}
          </>
        ) : !isAvailabilityReady ? (
          <p className="text-sm text-eventos-muted-text">
            Consultando disponibilidad...
          </p>
        ) : availableSeats <= 0 ? (
          <p className="text-lg font-semibold text-eventos-muted-text">
            Sin lugares disponibles
          </p>
        ) : !allowsReservation ? (
          <p className="text-lg font-semibold text-eventos-muted-text">
            Reservaciones no disponibles
          </p>
        ) : authenticationState === "session-error" ? (
          <div className="w-full rounded-lg border border-eventos-reservation-notice-border bg-eventos-reservation-notice p-4 text-left">
            <p role="alert" className="font-semibold text-eventos-reservation-notice-text">
              No pudimos verificar tu sesión
            </p>
            <p className="mt-2 text-sm text-eventos-reservation-notice-text">
              Inicia sesión nuevamente para comprobar tus boletos y continuar.
            </p>
            {onLogin && (
              <button
                type="button"
                onClick={onLogin}
                className="mt-4 w-full rounded-lg bg-eventos-primary px-4 py-3 text-sm font-semibold text-eventos-on-primary hover:bg-eventos-action-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-eventos-primary"
              >
                Iniciar sesión nuevamente
              </button>
            )}
          </div>
        ) : estadoReservaUsuario === "error" ? (
          <>
            <p role="alert" className="text-sm text-eventos-error-strong">
              {error ?? "No fue posible verificar tus reservaciones."}
            </p>
            {onRetryAvailability && (
              <button
                type="button"
                onClick={onRetryAvailability}
                className="rounded-lg border border-eventos-primary px-5 py-2 font-semibold text-eventos-primary hover:bg-eventos-action-hover-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-eventos-primary"
              >
                Reintentar
              </button>
            )}
          </>
        ) : authenticationState === "guest" ? (
          <div className="w-full rounded-lg border border-eventos-reservation-notice-border bg-eventos-reservation-notice p-4 text-left">
            <p className="font-semibold text-eventos-reservation-notice-text">
              ¿Quieres reservar un lugar?
            </p>
            <p className="mt-2 text-sm text-eventos-reservation-notice-text">
              Inicia sesión para consultar tus boletos y solicitar una reservación.
            </p>
            {onLogin && (
              <button
                type="button"
                onClick={onLogin}
                className="mt-4 w-full rounded-lg bg-eventos-primary px-4 py-3 text-sm font-semibold text-eventos-on-primary hover:bg-eventos-action-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-eventos-primary"
              >
                Iniciar sesión para reservar
              </button>
            )}
          </div>
        ) : estadoReservaUsuario === "no-consultado" ? (
          <p className="text-sm text-eventos-muted-text">
            Comprobando si ya tienes una reservación...
          </p>
        ) : (
          <button
            type="button"
            disabled={!canReserve}
            aria-busy={isSubmitting}
            onClick={() => onReserve(idSubEvento)}
            className="rounded-xl bg-eventos-primary px-7 py-5 font-merriweather text-xl font-semibold text-eventos-on-primary transition-colors hover:bg-eventos-action-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-eventos-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Procesando..." : "Reservar Lugar"}
          </button>
        )}
      </div>
    </section>
  );
}