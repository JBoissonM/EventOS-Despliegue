import { useEffect, useMemo, useRef, useState } from "react";
import {
  useLocation,
  useMatch,
  useNavigationType,
  useSearchParams,
} from "react-router";
import { esFechaCalendarioValida } from "../../../components/atoms/DateInput/DateInput";
import { CatalogEventCard } from "../components/CatalogEventCard";
import { useEventCatalog } from "../hooks/useEventCatalog";
import { PageHeader } from "../../../components/organisms/PageHeader/PageHeader";
import {
  nextCatalogRefreshDelay,
  visibleEvents,
  type DateFilter,
} from "../utils/catalogFilters";
import { PageContainer } from "../../../components/templates/PageContainer";
import { SearchField } from "../../../components/molecules/SearchField";
import { FilterDropdown, type FilterOption } from "../../../components/molecules/FilterDropdown";
import { DateRangeFields } from "../../../components/molecules/DateRangeFields";
import { ClearFiltersButton } from "../../../components/molecules/ClearFiltersButton";
import { FeedbackNotice } from "../../../components/molecules/FeedbackNotice";
import { PageState } from "../../../components/organisms/PageState/PageState";

const dateOptions: FilterOption[] = [
  { value: "proximos", label: "Próximos 7 días" },
  { value: "mes_actual", label: "Este mes" },
  { value: "mes_siguiente", label: "Próximo mes" },
  { value: "personalizado", label: "Rango personalizado" },
];

type CatalogFilterKey = "q" | "periodo" | "espacio" | "desde" | "hasta";

function isDateFilter(value: string | null): value is DateFilter {
  return (
    value === "todas" ||
    value === "proximos" ||
    value === "mes_actual" ||
    value === "mes_siguiente" ||
    value === "personalizado"
  );
}

function readIsoDate(value: string | null): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? "");

  if (!match) {
    return "";
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  return esFechaCalendarioValida(year, month, day) ? match[0] : "";
}

const catalogScrollPrefix = "eventos:catalog:scroll:";
const catalogPendingReturnKey = "eventos:catalog:pending-return";

function shouldRestoreCatalogScroll(state: unknown): boolean {
  return (
    typeof state === "object" &&
    state !== null &&
    !Array.isArray(state) &&
    (state as Record<string, unknown>).restoreCatalogScroll === true
  );
}

export function EventCatalogPage() {
  const { events, status, error, retry, failedCount } = useEventCatalog();
  const [clockNow, setClockNow] = useState(() => Date.now());
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  const navigationType = useNavigationType();
  const restoredLocationRef = useRef<string | null>(null);

  const catalogUrl = `${location.pathname}${location.search}`;
  const catalogScrollKey = `${catalogScrollPrefix}${catalogUrl}`;

  const search = searchParams.get("q") ?? "";
  const period = searchParams.get("periodo");
  const dateFilter: DateFilter = isDateFilter(period) ? period : "todas";
  const venue = searchParams.get("espacio") ?? "";

  const rangeStart =
    dateFilter === "personalizado"
      ? readIsoDate(searchParams.get("desde"))
      : "";

  const rangeEnd =
    dateFilter === "personalizado"
      ? readIsoDate(searchParams.get("hasta"))
      : "";

  const invalidDateRange =
    dateFilter === "personalizado" &&
    rangeStart !== "" &&
    rangeEnd !== "" &&
    rangeStart > rangeEnd;

  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    let changed = false;

    for (const key of ["desde", "hasta"] as const) {
      const value = next.get(key);

      if (
        value !== null &&
        (dateFilter !== "personalizado" || readIsoDate(value) !== value)
      ) {
        next.delete(key);
        changed = true;
      }
    }

    if (changed) {
      setSearchParams(next, {
        replace: true,
        preventScrollReset: true,
      });
    }
  }, [dateFilter, searchParams, setSearchParams]);

  const updateFilters = (
    changes: Partial<Record<CatalogFilterKey, string>>,
  ) => {
    const next = new URLSearchParams(searchParams);

    for (const [key, value] of Object.entries(changes)) {
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
    }

    setSearchParams(next, {
      replace: true,
      preventScrollReset: true,
    });
  };

  const saveCatalogScroll = () => {
    try {
      sessionStorage.setItem(catalogScrollKey, String(window.scrollY));
      sessionStorage.setItem(catalogPendingReturnKey, catalogUrl);
    } catch {
      return;
    }
  };

  useEffect(() => {
    let timeoutId: number | undefined;

    const updateClock = () => {
      const now = Date.now();

      setClockNow(now);

      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }

      const delay = nextCatalogRefreshDelay(events, new Date(now));

      timeoutId = window.setTimeout(updateClock, delay);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        updateClock();
      }
    };

    updateClock();

    window.addEventListener("focus", updateClock);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }

      window.removeEventListener("focus", updateClock);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [events]);

  const venues = useMemo(() => {
    const currentEvents = visibleEvents(
      events,
      "",
      "todas",
      "",
      "",
      "",
      new Date(clockNow),
    );

    return [
      ...new Set(
        currentEvents.flatMap((event) =>
          (event.subEventos ?? [])
            .map((activity) => activity.recinto?.nombre)
            .filter((name): name is string => Boolean(name)),
        ),
      ),
    ].sort((a, b) => a.localeCompare(b, "es"));
  }, [events, clockNow]);

  const filteredEvents = useMemo(
    () =>
      visibleEvents(
        events,
        search,
        dateFilter,
        venue,
        rangeStart,
        rangeEnd,
        new Date(clockNow),
      ),
    [
      events,
      search,
      dateFilter,
      venue,
      rangeStart,
      rangeEnd,
      clockNow,
    ],
  );

  const hasFilters = search.trim() !== "" || dateFilter !== "todas" || venue !== "";

  const resetFilters = () => {
    const next = new URLSearchParams(searchParams);

    for (const key of ["q", "periodo", "espacio", "desde", "hasta"]) {
      next.delete(key);
    }

    setSearchParams(next, {
      replace: true,
      preventScrollReset: true,
    });
  };

  const isAssistantCatalog = useMatch("/asistente/cartelera") !== null;

  useEffect(() => {
    if (
      status !== "success" ||
      restoredLocationRef.current === location.key
    ) {
      return;
    }

    let pendingReturn: string | null;
    let savedPosition: string | null;

    try {
      pendingReturn = sessionStorage.getItem(catalogPendingReturnKey);
      savedPosition = sessionStorage.getItem(catalogScrollKey);
    } catch {
      return;
    }

    const restoreRequested = shouldRestoreCatalogScroll(location.state);

    const returningWithBrowser =
      navigationType === "POP" && pendingReturn === catalogUrl;

    if (!restoreRequested && !returningWithBrowser) {
      if (pendingReturn === catalogUrl) {
        try {
          sessionStorage.removeItem(catalogPendingReturnKey);
        } catch {
          return;
        }
      }

      return;
    }

    if (savedPosition === null) {
      return;
    }

    const position = Number(savedPosition);

    if (!Number.isFinite(position) || position < 0) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      window.scrollTo({
        top: position,
        behavior: "instant",
      });

      restoredLocationRef.current = location.key;

      try {
        if (
          sessionStorage.getItem(catalogPendingReturnKey) === catalogUrl
        ) {
          sessionStorage.removeItem(catalogPendingReturnKey);
        }
      } catch {
        return;
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [
    catalogScrollKey,
    catalogUrl,
    location.key,
    location.state,
    navigationType,
    status,
  ]);

  return (
    <PageContainer>
      <div
        className={
          dateFilter === "personalizado"
            ? "mb-4 flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between"
            : "mb-6 flex flex-col gap-6 lg:mb-8 xl:flex-row xl:items-start xl:justify-between"
        }
      >
      <div className="min-w-0 xl:max-w-sm xl:shrink-0">
          <PageHeader
            title="Cartelera de Eventos"
            description="Explora los próximos eventos y actividades."
            back={
              isAssistantCatalog
                ? {
                  to: "/menu-asistente",
                  label: "Volver al menú principal",
                }
                : undefined
            }
          />
        </div>

        <div className="w-full min-w-0 space-y-3 xl:max-w-5xl">
          <SearchField
            value={search}
            onChange={(value) => updateFilters({ q: value })}
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="min-w-0">
              <FilterDropdown
                label="Fecha"
                allLabel="Todas las fechas"
                allValue="todas"
                value={dateFilter}
                options={dateOptions}
                onChange={(value) => {
                  if (!isDateFilter(value)) {
                    return;
                  }

                  updateFilters({
                    periodo: value === "todas" ? "" : value,
                    desde: value === "personalizado" ? rangeStart : "",
                    hasta: value === "personalizado" ? rangeEnd : "",
                  });
                }}
              />
            </div>

            <div className="min-w-0">
              <FilterDropdown
                label="Espacio"
                allLabel="Todos los espacios"
                value={venue}
                options={[
                  ...venues.map((name) => ({
                    value: name,
                    label: name,
                  })),
                  ...(venue && !venues.includes(venue)
                    ? [{ value: venue, label: venue }]
                    : []),
                ]}
                onChange={(value) => updateFilters({ espacio: value })}
              />
            </div>
          </div>
        </div>
      </div>

      {dateFilter === "personalizado" && (
        <DateRangeFields
          startDate={rangeStart}
          endDate={rangeEnd}
          onStartDateChange={(value) => updateFilters({ desde: value })}
          onEndDateChange={(value) => updateFilters({ hasta: value })}
          className="mb-3"
        />
      )}

      {hasFilters && (
        <div className="mb-6 flex justify-end">
          <ClearFiltersButton onClick={resetFilters} />
        </div>
      )}

      {status === "success" && invalidDateRange && (
        <div className="mb-6">
          <FeedbackNotice
            variant="warning"
            title="Rango de fechas inválido"
          >
            <p>
              La fecha de inicio no puede ser posterior a la fecha de fin.
              Corrige las fechas para consultar los eventos.
            </p>
          </FeedbackNotice>
        </div>
      )}

      {status === "loading" && (
        <PageState
          variant="loading"
          title="Cargando eventos próximos..."
        />
      )}

      {status === "error" && (
        <PageState
          variant="error"
          title="No se pudo cargar la cartelera"
          description={error}
          action={
            <button
              type="button"
              onClick={retry}
              className="inline-flex cursor-pointer items-center justify-center rounded-md bg-eventos-primary px-5 py-2 font-semibold text-eventos-on-primary hover:bg-eventos-action-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-eventos-primary"
            >
              Reintentar
            </button>
          }
        />
      )}

      {status === "success" && failedCount > 0 && (
        <div className="mb-6">
          <FeedbackNotice
            variant="warning"
            title="No se pudieron cargar todos los eventos"
            action={
              <button
                type="button"
                onClick={retry}
                className="inline-flex cursor-pointer items-center justify-center rounded-md bg-eventos-primary px-4 py-2 text-sm font-semibold text-eventos-on-primary hover:bg-eventos-action-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-eventos-primary"
              >
                Reintentar carga
              </button>
            }
          >
            <p>
              {failedCount === 1
                ? "No se pudo recuperar la información de un evento."
                : `No se pudo recuperar la información de ${failedCount} eventos.`}{" "}
              Puedes consultar los eventos disponibles o intentar cargar nuevamente.
            </p>
          </FeedbackNotice>
        </div>
      )}

      {status === "success" &&
        !invalidDateRange &&
        filteredEvents.length === 0 &&
        (events.length > 0 || failedCount === 0) && (
          <PageState
            variant="empty"
            title={
              events.length === 0 || !hasFilters
                ? failedCount > 0
                  ? "No hay eventos próximos entre los eventos cargados"
                  : "No hay eventos próximos"
                : failedCount > 0
                  ? "No hay coincidencias entre los eventos cargados"
                  : "No encontramos eventos con esos filtros"
            }
          />
        )}

      {status === "success" && !invalidDateRange && filteredEvents.length > 0 && (
        <>
          <p className="sr-only" role="status" aria-live="polite">
            {filteredEvents.length} eventos encontrados
          </p>
          <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {filteredEvents.map((event) => (
              <CatalogEventCard
                key={event.idEvento}
                event={event}
                catalogReturnTo={catalogUrl}
                onOpenDetails={saveCatalogScroll}
              />
            ))}
          </div>
        </>
      )}
    </PageContainer>
  );
}
