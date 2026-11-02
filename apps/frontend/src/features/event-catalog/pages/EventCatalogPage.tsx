import { useMemo, useState } from "react";
import { AlertCircle, CalendarDays, LoaderCircle, Search } from "lucide-react";

import { CatalogEventCard } from "../components/CatalogEventCard";
import { useEventCatalog } from "../hooks/useEventCatalog";
import {
  speakerName,
  visibleEvents,
  type DateFilter,
} from "../utils/catalogFilters";

export function EventCatalogPage() {
  const { events, status, error, retry } = useEventCatalog();
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("todas");
  const [venue, setVenue] = useState("");
  const [speaker, setSpeaker] = useState("");

  const venues = useMemo(() =>
    [...new Set(events.flatMap((event) =>
      (event.subEventos ?? []).map((activity) => activity.recinto?.nombre).filter((name): name is string => Boolean(name)),
    ))].sort((a, b) => a.localeCompare(b, "es")),
    [events],
  );

  const speakers = useMemo(() =>
    [...new Set(events.flatMap((event) =>
      (event.subEventos ?? []).flatMap((activity) => (activity.ponentes ?? []).map(speakerName)),
    ))].sort((a, b) => a.localeCompare(b, "es")),
    [events],
  );

  const filteredEvents = useMemo(
    () => visibleEvents(events, search, dateFilter, venue, speaker),
    [events, search, dateFilter, venue, speaker],
  );

  const hasFilters = search.trim() !== "" || dateFilter !== "todas" || venue !== "" || speaker !== "";
  const resetFilters = () => {
    setSearch("");
    setDateFilter("todas");
    setVenue("");
    setSpeaker("");
  };

  return (
    <section className="mx-auto w-full max-w-7xl px-2 py-4 font-merriweather sm:px-6 lg:px-8">
      <div className="mb-10 flex flex-col gap-5 lg:mb-12 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="shrink-0 text-3xl font-bold text-eventos-ink">
          Cartelera de Eventos
        </h1>

        <div className="grid w-full grid-cols-2 gap-3 lg:flex lg:max-w-4xl lg:flex-wrap lg:items-center lg:justify-end">
          <label className="relative col-span-2 min-w-0 lg:min-w-[230px] lg:flex-1 lg:max-w-sm">
            <span className="sr-only">Buscar evento o ponente</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar evento o ponente..."
              className="h-11 w-full rounded-md border border-eventos-divider-strong bg-eventos-on-primary py-2 pl-3 pr-11 text-sm text-eventos-body-text outline-offset-2 placeholder:text-eventos-placeholder-text focus-visible:outline-2 focus-visible:outline-eventos-secondary"
            />
            <Search size={19} aria-hidden="true" className="pointer-events-none absolute right-3 top-3 text-eventos-muted-text" />
          </label>

          <label className="min-w-0">
            <span className="sr-only">Filtrar por fecha</span>
            <select
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value as DateFilter)}
              className="h-11 w-full rounded-md border border-eventos-divider-strong bg-eventos-on-primary px-3 text-sm text-eventos-body-text focus-visible:outline-2 focus-visible:outline-eventos-secondary"
            >
              <option value="todas">Fecha</option>
              <option value="hoy">Hoy</option>
              <option value="semana">Esta semana</option>
              <option value="mes">Este mes</option>
            </select>
          </label>

          <label className="min-w-0">
            <span className="sr-only">Filtrar por espacio</span>
            <select
              value={venue}
              onChange={(event) => setVenue(event.target.value)}
              className="h-11 w-full rounded-md border border-eventos-divider-strong bg-eventos-on-primary px-3 text-sm text-eventos-body-text focus-visible:outline-2 focus-visible:outline-eventos-secondary"
            >
              <option value="">Espacio</option>
              {venues.map((name) => <option value={name} key={name}>{name}</option>)}
            </select>
          </label>

          <label className="col-span-2 min-w-0 sm:col-span-1">
            <span className="sr-only">Filtrar por ponente</span>
            <select
              value={speaker}
              onChange={(event) => setSpeaker(event.target.value)}
              className="h-11 w-full rounded-md border border-eventos-divider-strong bg-eventos-on-primary px-3 text-sm text-eventos-body-text focus-visible:outline-2 focus-visible:outline-eventos-secondary"
            >
              <option value="">Ponente</option>
              {speakers.map((name) => <option value={name} key={name}>{name}</option>)}
            </select>
          </label>
        </div>
      </div>

      {status === "loading" && (
        <div role="status" aria-live="polite" className="flex min-h-72 flex-col items-center justify-center gap-4 text-eventos-muted-text">
          <LoaderCircle size={32} className="animate-spin" aria-hidden="true" />
          <p>Cargando eventos próximos...</p>
        </div>
      )}

      {status === "error" && (
        <div role="alert" className="flex min-h-64 flex-col items-center justify-center gap-4 rounded-lg border border-eventos-divider p-6 text-center">
          <AlertCircle size={34} className="text-eventos-error-strong" aria-hidden="true" />
          <p>{error}</p>
          <button
            type="button"
            onClick={retry}
            className="rounded-md bg-eventos-primary px-5 py-2 font-semibold text-eventos-on-primary hover:bg-eventos-action-hover"
          >
            Reintentar
          </button>
        </div>
      )}

      {status === "success" && filteredEvents.length === 0 && (
        <div role="status" className="flex min-h-64 flex-col items-center justify-center gap-4 rounded-lg border border-eventos-divider p-6 text-center">
          <CalendarDays size={34} className="text-eventos-muted-text" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-eventos-ink">
            {events.length === 0 ? "No hay eventos próximos" : "No encontramos eventos con esos filtros"}
          </h2>
          {hasFilters && (
            <button type="button" onClick={resetFilters} className="rounded-md border border-eventos-primary px-5 py-2 font-semibold text-eventos-primary hover:bg-eventos-action-hover-soft">
              Limpiar filtros
            </button>
          )}
        </div>
      )}

      {status === "success" && filteredEvents.length > 0 && (
        <>
          <p className="sr-only" role="status" aria-live="polite">
            {filteredEvents.length} eventos encontrados
          </p>
          <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {filteredEvents.map((event) => (
              <CatalogEventCard key={event.idEvento} event={event} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
