import { useState } from "react";
import { Link } from "react-router";
import { CalendarDays, Clock3, ImageOff, MapPin } from "lucide-react";
import { EventScopeBadge } from "../../../components/atoms/Badge/EventScopeBadge";
import { resolverUrlPoster } from "../../../utils/posterUrl";

import type { CatalogEventApi } from "../types/eventCatalog.types";
import {
  formatCatalogDate,
  formatCatalogTime,
  getEventDates,
} from "../utils/catalogFilters";

interface CatalogEventCardProps {
  event: CatalogEventApi;
  headingLevel?: "h2" | "h3";
  catalogReturnTo?: string;
  onOpenDetails?: () => void;
}

export function CatalogEventCard({
                                   event,
                                   headingLevel: Heading = "h2",
                                   catalogReturnTo,
                                   onOpenDetails,
                                 }: CatalogEventCardProps) {
  const [failedPoster, setFailedPoster] = useState<string | null>(null);

  const poster = resolverUrlPoster(event.poster);

  const imageAvailable = poster !== null && failedPoster !== poster;

  const dates = getEventDates(event);
  const firstDate = dates[0] ?? null;
  const lastDate = dates[dates.length - 1] ?? null;

  const singleActivity =
    event.subEventos?.length === 1 ? event.subEventos[0] : null;

  const venueNames = [
    ...new Set(
      (event.subEventos ?? [])
        .map((activity) => activity.recinto?.nombre)
        .filter((name): name is string => Boolean(name))
    ),
  ];

  return (
    <article className="flex h-full min-w-0 flex-col overflow-hidden rounded-lg border border-eventos-panel-border bg-eventos-surface p-4 shadow-sm">
      <div className="mb-4 flex aspect-video items-center justify-center overflow-hidden rounded-md bg-eventos-panel-surface">
        {imageAvailable ? (
          <img
            src={poster ?? undefined}
            alt={`Póster de ${event.nombre}`}
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
            onError={() => setFailedPoster(poster)}
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-eventos-placeholder-text">
            <ImageOff size={30} aria-hidden="true" />
            <span className="text-sm">
              Póster no disponible
            </span>
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <EventScopeBadge scope={event.idAlcance} />

        <Heading className="min-w-0 break-words font-merriweather text-lg font-semibold leading-snug text-eventos-ink">
          {event.nombre}
        </Heading>

        <div className="space-y-1.5 text-sm leading-relaxed text-eventos-body-text">
          {firstDate === null ? (
            <p className="flex items-start gap-1.5">
              <CalendarDays size={16} className="mt-0.5 shrink-0 text-eventos-body-text" aria-hidden="true" />
              <span>
                <strong>Fecha:</strong> Por confirmar
              </span>
            </p>
          ) : firstDate === lastDate ? (
            <p className="flex items-start gap-1.5">
              <CalendarDays size={16} className="mt-0.5 shrink-0 text-eventos-body-text" aria-hidden="true" />
              <span>
                <strong>Fecha:</strong> {formatCatalogDate(firstDate)}
              </span>
            </p>
          ) : (
            <>
              <p className="flex items-start gap-1.5">
                <CalendarDays size={16} className="mt-0.5 shrink-0 text-eventos-body-text" aria-hidden="true" />
                <span>
                  <strong>Fecha inicio:</strong> {formatCatalogDate(firstDate)}
                </span>
              </p>
              <p className="flex items-start gap-1.5">
                <CalendarDays size={16} className="mt-0.5 shrink-0 text-eventos-body-text" aria-hidden="true" />
                <span>
                  <strong>Fecha fin:</strong> {formatCatalogDate(lastDate!)}
                </span>
              </p>
            </>
          )}

          {singleActivity?.fecha && (
            <p className="flex items-start gap-1.5">
              <Clock3 size={16} className="mt-0.5 shrink-0 text-eventos-body-text" aria-hidden="true" />
              <span>
                <strong>Horario:</strong>{" "}
                {formatCatalogTime(singleActivity.fecha.horaInicio)}
                {" – "}
                {formatCatalogTime(singleActivity.fecha.horaFin)} hrs
              </span>
            </p>
          )}

          {venueNames.length === 1 && (
            <p className="flex items-start gap-1.5">
              <MapPin size={16} className="mt-0.5 shrink-0 text-eventos-body-text" aria-hidden="true" />
              <span>
                <strong>Espacio:</strong> {venueNames[0]}
              </span>
            </p>
          )}

          {venueNames.length > 1 && (
            <p className="flex items-start gap-1.5">
              <MapPin size={16} className="mt-0.5 shrink-0 text-eventos-body-text" aria-hidden="true" />
              <span>
                <strong>Espacios:</strong> {venueNames.join(", ")}
              </span>
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Link
          to={`/eventos/${event.idEvento}`}
          state={catalogReturnTo ? { catalogReturnTo } : undefined}
          onClick={onOpenDetails}
          className="inline-flex min-h-10 items-center justify-center rounded-md bg-eventos-primary px-5 py-2 text-sm font-semibold text-eventos-on-primary transition-colors hover:bg-eventos-action-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-eventos-primary"
        >
          Ver detalles
        </Link>
      </div>
    </article>
  );
}