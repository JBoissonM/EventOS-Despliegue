import { useEffect, useState } from "react";
import {
  Navigate,
  useNavigate,
  useParams,
} from "react-router";

import { EstadoBoleto } from "@eventos/shared";
import { ApiError } from "../../../lib/apiClient";

import { EventDetailsRequestState } from "../components/molecules/EventDetailsRequestState";
import { useSubEventDetails } from "../hooks/useSubEventDetails";

import { ReservationPage } from "../../reservations/pages/ReservationPage";
import { useReservationAvailability } from "../../reservations/hooks/useReservationAvailability";
import {
  reservationsService,
  toSeatMapItems,
} from "../../reservations/services/reservations.service";
import { ticketsService } from "../../tickets/services/tickets.service";

type TicketCheckStatus =
  | "checking"
  | "clear"
  | "reserved"
  | "error";

function parseId(value: string | undefined): number | null {
  if (!value || !/^\d+$/.test(value)) {
    return null;
  }

  const id = Number(value);

  return Number.isSafeInteger(id) && id > 0
    ? id
    : null;
}

export function ReservationRoute() {
  const params = useParams();
  const navigate = useNavigate();

  const idEvento = parseId(params.idEvento);
  const idSubEvento = parseId(params.idSubEvento);
  const hasSession = Boolean(localStorage.getItem("token"));

  const [ticketStatus, setTicketStatus] =
    useState<TicketCheckStatus>("checking");

  const [ticketError, setTicketError] =
    useState<string | null>(null);

  const [ticketRetry, setTicketRetry] = useState(0);
  const [reservationConflict, setReservationConflict] = useState<string | null>(null);

  const {
    activity,
    status,
    error,
    retry,
  } = useSubEventDetails(idEvento, idSubEvento);

  const {
    availability,
    isLoading,
    error: availabilityError,
    refresh,
  } = useReservationAvailability(idSubEvento);

  useEffect(() => {
    if (!hasSession || idSubEvento === null) {
      return;
    }

    let active = true;

    setTicketStatus("checking");
    setTicketError(null);

    void ticketsService
      .getMyTickets()
      .then((tickets) => {
        if (!active) {
          return;
        }

        const alreadyReserved = tickets.some(
          (ticket) =>
            ticket.idSubEvento === idSubEvento &&
            (
              ticket.estadoBoleto === EstadoBoleto.VALIDO ||
              ticket.estadoBoleto === EstadoBoleto.UTILIZADO
            ),
        );

        setTicketStatus(
          alreadyReserved ? "reserved" : "clear",
        );
      })
      .catch((cause: unknown) => {
        if (!active) {
          return;
        }

        setTicketError(
          cause instanceof Error
            ? cause.message
            : "No fue posible verificar tus boletos.",
        );

        setTicketStatus("error");
      });

    return () => {
      active = false;
    };
  }, [hasSession, idSubEvento, ticketRetry]);

  if (!hasSession) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          returnUrl:
            idEvento === null || idSubEvento === null
              ? null
              : `/eventos/${idEvento}/actividades/${idSubEvento}`,
        }}
      />
    );
  }

  if (status !== "success" || activity === null) {
    return (
      <EventDetailsRequestState
        status={status === "success" ? "error" : status}
        error={error}
        onRetry={retry}
      />
    );
  }

  const backPath =
    `/eventos/${activity.idEvento}/actividades/${activity.idSubEvento}`;

  const backButton = (
    <button
      type="button"
      onClick={() => navigate(backPath)}
      className="font-semibold text-eventos-primary hover:underline"
    >
      Volver a los detalles de la actividad
    </button>
  );

  if (ticketStatus === "checking") {
    return (
      <div role="status" className="p-8 text-center">
        Verificando tus reservaciones...
      </div>
    );
  }

  if (ticketStatus === "error") {
    return (
      <section className="mx-auto max-w-xl space-y-5 p-8 text-center">
        <h1 className="text-2xl font-bold">
          No fue posible verificar tus boletos
        </h1>

        <p role="alert">
          {ticketError}
        </p>

        <button
          type="button"
          onClick={() => setTicketRetry((value) => value + 1)}
          className="rounded-lg bg-eventos-primary px-5 py-3 text-eventos-on-primary"
        >
          Reintentar
        </button>

        <div>{backButton}</div>
      </section>
    );
  }

  if (ticketStatus === "reserved") {
    return (
      <section className="mx-auto max-w-xl space-y-5 p-8 text-center">
        <h1 className="text-2xl font-bold">
          Ya tienes una reservación
        </h1>

        <p>
          Ya cuentas con un boleto válido o utilizado
          para esta actividad.
        </p>

        {backButton}
      </section>
    );
  }

  if (isLoading || (!availability && !availabilityError)) {
    return (
      <div role="status" className="p-8 text-center">
        Consultando la disponibilidad...
      </div>
    );
  }

  if (availabilityError || !availability) {
    return (
      <section className="space-y-5 p-8 text-center">
        <p role="alert">
          {availabilityError ?? "No se encontró la disponibilidad."}
        </p>

        <button
          type="button"
          onClick={refresh}
          className="rounded-lg bg-eventos-primary px-5 py-3 text-eventos-on-primary"
        >
          Reintentar
        </button>
      </section>
    );
  }

  if (
    availability.idSubEvento !== activity.idSubEvento ||
    !activity.fecha ||
    !activity.recinto
  ) {
    return (
      <section className="space-y-4 p-8 text-center">
        <p role="alert">
          La información de esta actividad está incompleta.
        </p>

        {backButton}
      </section>
    );
  }

  if (
    !availability.permiteReservar ||
    availability.lugaresDisponibles <= 0
  ) {
    return (
      <section className="space-y-4 p-8 text-center">
        <h1 className="text-2xl font-bold">
          Reservaciones no disponibles
        </h1>

        <p>
          Esta actividad no permite nuevas reservaciones
          en este momento.
        </p>

        {backButton}
      </section>
    );
  }

  const details = {
    eventName: activity.nombre,
    date: activity.fecha.fecha,
    startTime: activity.fecha.horaInicio,
    endTime: activity.fecha.horaFin,
    venue: activity.recinto.nombre,
    availableSeats: availability.lugaresDisponibles,
    onViewTicket: (idBoleto: number) => navigate(`/asistente/boletos/${idBoleto}`),
  };

  const reservationContent =
    availability.requiereSeleccionAsiento ? (
      <ReservationPage
        mode="manual"
        {...details}
        seats={toSeatMapItems(availability.asientos)}
        onReserve={async (idAsiento) => {
          setReservationConflict(null);
          try {
            const response = await reservationsService.createReservation({
              idSubEvento: activity.idSubEvento,
              idAsiento,
            });
            return response.boleto.idBoleto;
          } catch (cause) {
            if (cause instanceof ApiError && cause.status === 409) {
              setReservationConflict(cause.message);
              refresh();
              setTicketRetry((current) => current + 1);
            }
            throw cause;
          }
        }}
      />
    ) : (
      <ReservationPage
        mode="automatic"
        {...details}
        onReserve={async () => {
          setReservationConflict(null);
          try {
            const response = await reservationsService.createReservation({
              idSubEvento: activity.idSubEvento,
            });
            return response.boleto.idBoleto;
          } catch (cause) {
            if (cause instanceof ApiError && cause.status === 409) {
              setReservationConflict(cause.message);
              refresh();
              setTicketRetry((current) => current + 1);
            }
            throw cause;
          }
        }}
      />
    );

  return (
    <div className="space-y-4">
      <div className="px-6 pt-6">
        {backButton}
      </div>

      {reservationConflict && (
        <p role="alert" className="mx-6 rounded-lg border border-eventos-error px-4 py-3 text-eventos-error">
          {reservationConflict} Hemos actualizado la disponibilidad; selecciona otro lugar si es necesario.
        </p>
      )}
      {reservationContent}
    </div>
  );
}