import { ArrowLeft } from "lucide-react";
import { Link, Navigate, useParams } from "react-router";
import { EventDetailsRequestState } from "../../event-details/components/molecules/EventDetailsRequestState";
import { useSubEventDetails } from "../../event-details/hooks/useSubEventDetails";
import { getAuthPathWithReturnUrl } from "../../event-details/utils/eventReturnUrl";
import { formatEventDate } from "../../event-details/utils/formatEventDate";
import { useReservationAvailability } from "../hooks/useReservationAvailability";
import { reservationsService, toSeatMapItems } from "../services/reservations.service";
import { ReservationPage } from "./ReservationPage";

function parseId(value: string | undefined): number | null {
  if (!value || !/^[1-9]\d*$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

const allowedRoles = new Set(["Asistente", "Usuario Interno", "Usuario Externo"]);

export function ReservationRoute() {
  const { idEvento, idSubEvento } = useParams();
  const eventId = parseId(idEvento);
  const activityId = parseId(idSubEvento);
  const detailPath = `/eventos/${idEvento ?? ""}/actividades/${idSubEvento ?? ""}`;
  const validIds = eventId !== null && activityId !== null;
  const { event, activity, status, error, retry } = useSubEventDetails(eventId, activityId);
  const { availability, isLoading, error: availabilityError, refresh } = useReservationAvailability(validIds ? activityId : null);
  const token = localStorage.getItem("token");
  let role: unknown = null;

  try {
    role = JSON.parse(localStorage.getItem("usuario") || "{}").tipoCuenta;
  } catch {
    role = null;
  }

  if (!validIds) {
    return <EventDetailsRequestState status="invalid" error="Los identificadores del evento o la actividad no son válidos." onRetry={retry} />;
  }

  if (!token) {
    return <Navigate to={getAuthPathWithReturnUrl("/login", detailPath)} replace />;
  }

  if (typeof role !== "string" || !allowedRoles.has(role)) {
    return (
      <section className="mx-auto max-w-3xl space-y-4 p-6 text-eventos-body-text">
        <h1 className="text-2xl font-bold text-eventos-ink">Reservación no disponible para tu cuenta</h1>
        <p>Solo las cuentas de asistentes pueden realizar reservaciones.</p>
        <Link to={detailPath} className="font-semibold text-eventos-primary underline">Volver a la actividad</Link>
      </section>
    );
  }

  if (status !== "success" || !activity || !event) {
    return <EventDetailsRequestState status={status === "success" ? "error" : status} error={error} onRetry={retry} />;
  }

  if (!activity.accesoQR) {
    return (
      <section className="mx-auto max-w-3xl space-y-4 p-6 text-eventos-body-text">
        <h1 className="text-2xl font-bold text-eventos-ink">Actividad de entrada libre</h1>
        <p>Esta actividad no requiere una reservación con boleto QR.</p>
        <Link to={detailPath} className="font-semibold text-eventos-primary underline">Volver a la actividad</Link>
      </section>
    );
  }

  if (isLoading && !availability) {
    return <p role="status" className="mx-auto max-w-6xl px-4 py-8 text-eventos-body-text">Consultando disponibilidad...</p>;
  }

  if (availabilityError || !availability || availability.idSubEvento !== activity.idSubEvento) {
    return (
      <section className="mx-auto max-w-3xl space-y-4 p-6 text-eventos-body-text">
        <h1 className="text-2xl font-bold text-eventos-ink">No se pudo consultar la disponibilidad</h1>
        <p role="alert">{availabilityError || "La disponibilidad no corresponde a esta actividad."}</p>
        <button type="button" onClick={refresh} className="rounded-md bg-eventos-primary px-4 py-2 font-semibold text-eventos-on-primary">Reintentar</button>
        <Link to={detailPath} className="ml-4 font-semibold text-eventos-primary underline">Volver a la actividad</Link>
      </section>
    );
  }

  const canReserve = !isLoading && availability.permiteReservar === true && availability.lugaresDisponibles > 0;
  const mustChooseSeat = availability.requiereSeleccionAsiento === true;
  const venue = activity.recinto?.nombre ?? availability.recinto.nombre;
  const date = activity.fecha?.fecha ?? "";
  const startTime = activity.fecha?.horaInicio.slice(0, 5) ?? "";
  const endTime = activity.fecha?.horaFin.slice(0, 5) ?? "";

  const submitReservation = async (idAsiento?: number) => reservationsService.createReservation({
    idSubEvento: activity.idSubEvento,
    ...(idAsiento === undefined ? {} : { idAsiento }),
  });

  return (
    <div className="mx-auto w-full max-w-7xl px-2 py-4 font-merriweather sm:px-6 lg:px-8">
      <Link to={detailPath} className="inline-flex items-center gap-2 font-semibold text-eventos-primary hover:underline">
        <ArrowLeft size={20} aria-hidden="true" /> Volver a la actividad
      </Link>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-eventos-panel-border bg-eventos-panel-surface px-5 py-4">
        <div>
          <p className="font-semibold text-eventos-secondary">{event.nombre}</p>
          <p className="text-sm text-eventos-body-text">{formatEventDate(date)} · {startTime}–{endTime} hrs · {venue}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <p role="status" className="font-semibold text-eventos-secondary">Cupos: {availability.lugaresDisponibles}/{availability.recinto.aforo}</p>
          <button type="button" disabled={isLoading} onClick={refresh} className="rounded-md border border-eventos-primary px-3 py-2 text-sm font-semibold text-eventos-primary disabled:opacity-60">Actualizar disponibilidad</button>
        </div>
      </div>
      {!canReserve && (
        <p role="status" className="mt-5 rounded-lg border border-eventos-warning bg-eventos-warning/20 p-4 font-semibold text-eventos-body-text">
          No hay reservaciones disponibles para esta actividad en este momento.
        </p>
      )}
      {mustChooseSeat ? (
        <ReservationPage
          mode="manual"
          eventName={activity.nombre}
          parentEventName={event.nombre}
          date={date}
          startTime={startTime}
          endTime={endTime}
          venue={venue}
          seats={toSeatMapItems(availability.asientos)}
          aisleAfter={[6, 17]}
          canReserve={canReserve}
          onReserve={(idAsiento) => submitReservation(idAsiento)}
        />
      ) : (
        <ReservationPage
          mode="automatic"
          eventName={activity.nombre}
          parentEventName={event.nombre}
          date={date}
          startTime={startTime}
          endTime={endTime}
          venue={venue}
          canReserve={canReserve}
          onReserve={() => submitReservation()}
        />
      )}
    </div>
  );
}
