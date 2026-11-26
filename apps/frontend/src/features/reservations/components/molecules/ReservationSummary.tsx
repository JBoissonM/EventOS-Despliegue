import {
  CalendarCheck2,
  Layers,
  CalendarDays,
  Clock3,
  MapPin,
  Armchair,
} from "lucide-react";

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
            <div className="inline-flex gap-2 ">
              <CalendarCheck2
                size={18}
                className="mt-0.5 shrink-0 text-eventos-secondary"
                aria-hidden="true"
              />
              <dt className="font-semibold">Evento</dt>
            </div>
            <dd>{parentEventName}</dd>
          </div>
        )}
        <div>
          <div className="inline-flex gap-2 ">
            <Layers
              size={18}
              className="mt-0.5 shrink-0 text-eventos-secondary"
              aria-hidden="true"
            />
            <dt className="font-semibold">Actividad</dt>
          </div>
          <dd>{eventName}</dd>
        </div>

        <div>
          <div className="inline-flex gap-2 ">
            <CalendarDays
              size={18}
              className="mt-0.5 shrink-0 text-eventos-secondary"
              aria-hidden="true"
            />
            <dt className="font-semibold">Fecha</dt>
          </div>
          <dd>
            {date
              ? new Date(`${date}T12:00:00`).toLocaleDateString("es-MX", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                })
              : "Por confirmar"}
          </dd>
        </div>

        <div>
          <div className="inline-flex gap-2 ">
            <Clock3
              size={18}
              className="mt-0.5 shrink-0 text-eventos-secondary"
              aria-hidden="true"
            />
            <dt className="font-semibold">Horario</dt>
          </div>
          <dd>
            {startTime} - {endTime}
          </dd>
        </div>

        <div>
          <div className="inline-flex gap-2 ">
            <MapPin
              size={18}
              className="mt-0.5 shrink-0 text-eventos-secondary"
              aria-hidden="true"
            />
            <dt className="font-semibold">Recinto</dt>
          </div>
          <dd>{venue}</dd>
        </div>

        {showSeat && (
          <div>
            <div className="inline-flex gap-2 ">
              <Armchair
                size={18}
                className="mt-0.5 shrink-0 text-eventos-secondary"
                aria-hidden="true"
              />
              <dt className="font-semibold">Asiento</dt>
            </div>
            <dd>{selectedSeatLabel ?? "Sin seleccionar"}</dd>
          </div>
        )}
      </dl>
    </section>
  );
}

export default ReservationSummary;
