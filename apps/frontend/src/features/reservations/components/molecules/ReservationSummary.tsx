export interface ReservationSummaryProps {
  eventName: string;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  selectedSeatLabel: string | null;
  availableSeats?: number;
  showSeat?: boolean;
}

export function ReservationSummary({
                                     eventName,
                                     date,
                                     startTime,
                                     endTime,
                                     venue,
                                     selectedSeatLabel,
                                     availableSeats,
                                     showSeat = true,
                                   }: ReservationSummaryProps) {
  return (
    <section
      aria-label="Resumen de reservación"
      className="rounded-xl border border-eventos-neutral bg-white p-5"
    >
      <h2 className="mb-4 font-merriweather text-xl font-bold">
        Resumen de reservación
      </h2>

      <dl className="space-y-3 text-sm">
        <div>
          <dt className="font-semibold">Evento</dt>
          <dd className="mt-0.5">{eventName}</dd>
        </div>
        <div>
          <dt className="font-semibold">Fecha</dt>
          <dd className="mt-0.5">{date}</dd>
        </div>
        <div>
          <dt className="font-semibold">Horario</dt>
          <dd className="mt-0.5">{startTime} - {endTime}</dd>
        </div>
        <div>
          <dt className="font-semibold">Recinto</dt>
          <dd className="mt-0.5">{venue}</dd>
        </div>
        {showSeat && (
          <div>
            <dt className="font-semibold">Asiento seleccionado</dt>
            <dd className="mt-0.5" aria-live="polite">
              {selectedSeatLabel ?? "Sin seleccionar"}
            </dd>
          </div>
        )}
        {availableSeats !== undefined && (
          <div>
            <dt className="font-semibold">Lugares disponibles</dt>
            <dd className="mt-0.5">{availableSeats}</dd>
          </div>
        )}
      </dl>
    </section>
  );
}

export default ReservationSummary;