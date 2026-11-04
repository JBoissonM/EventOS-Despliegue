export interface ReservationSummaryProps {
  eventName: string;
  parentEventName?: string;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  selectedSeatLabel: string | null;
  showSeat?: boolean;
}

export function ReservationSummary({
                                     eventName,
                                     parentEventName,
                                     date,
                                     startTime,
                                     endTime,
                                     venue,
                                     selectedSeatLabel,
                                     showSeat = true,
                                   }: ReservationSummaryProps) {
  return (
    <section
      aria-label="Resumen de reservación"
      className="space-y-4 rounded-xl border
                 border-eventos-panel-border bg-eventos-panel-surface p-5"
    >
      <h2 className="font-merriweather text-xl font-bold text-eventos-ink">
        Resumen de reservación
      </h2>

      <dl className="space-y-3 text-sm">
        {parentEventName && (
          <div>
            <dt className="font-semibold">Evento</dt>
            <dd>{parentEventName}</dd>
          </div>
        )}
        <div>
          <dt className="font-semibold">Actividad</dt>
          <dd>{eventName}</dd>
        </div>

        <div>
          <dt className="font-semibold">Fecha</dt>
          <dd>{date ? new Date(`${date}T12:00:00`).toLocaleDateString("es-MX", { year: "numeric", month: "2-digit", day: "2-digit" }) : "Por confirmar"}</dd>
        </div>

        <div>
          <dt className="font-semibold">Horario</dt>
          <dd>
            {startTime} - {endTime}
          </dd>
        </div>

        <div>
          <dt className="font-semibold">Recinto</dt>
          <dd>{venue}</dd>
        </div>

        {showSeat && (
          <div>
            <dt className="font-semibold">Asiento</dt>
            <dd>{selectedSeatLabel ?? "Sin seleccionar"}</dd>
          </div>
        )}
      </dl>
    </section>
  );
}

export default ReservationSummary;
