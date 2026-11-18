import { useLocation } from "react-router";
import { PageBackLink } from "../../../components/molecules/PageBackLink";
import { PageContainer } from "../../../components/templates/PageContainer";
import { PageHeader } from "../../../components/organisms/PageHeader/PageHeader";
import { EventBanner } from "../components/molecules/EventBanner";
import { SpeakersList } from "../components/molecules/SpeakersList";
import { EventSessionCard } from "../components/molecules/EventSessionCard";
import { ActivityInformationCard } from "../components/molecules/ActivityInformationCard";
import type { EventDetailsViewModel } from "../types/eventDetails.types";
import { getCatalogOrigin } from "../../event-catalog/utils/catalogNavigation";
import { useEffect } from "react";

interface EventDetailsPageProps {
  event: EventDetailsViewModel;
}

function getCatalogReturnPath(): string {
  if (!localStorage.getItem("token")) return "/cartelera";

  try {
    const usuario = JSON.parse(localStorage.getItem("usuario") || "{}") as {
      tipoCuenta?: unknown;
    };

    const canAccessAssistantCatalog =
      usuario.tipoCuenta === "Asistente" ||
      usuario.tipoCuenta === "Usuario Externo" ||
      usuario.tipoCuenta === "Usuario Interno";

    return canAccessAssistantCatalog ? "/asistente/cartelera" : "/cartelera";
  } catch {
    return "/cartelera";
  }
}

export function EventDetailsPage({ event }: EventDetailsPageProps) {
  const location = useLocation();
  const activity = event.actividades.length === 1 ? event.actividades[0] : null;
  const catalogOrigin = getCatalogOrigin(location.state);
  const returnPath = catalogOrigin ?? getCatalogReturnPath();

  const eventScrollKey = `eventos:event-details:scroll:${event.idEvento}`;

  const saveEventScroll = () => {
    try {
      sessionStorage.setItem(eventScrollKey, String(window.scrollY));
    } catch {
      return;
    }
  };

  useEffect(() => {
    const shouldRestore =
      typeof location.state === "object" &&
      location.state !== null &&
      !Array.isArray(location.state) &&
      (location.state as Record<string, unknown>).restoreEventScroll === true;

    if (!shouldRestore) {
      return;
    }

    let savedPosition: string | null;

    try {
      savedPosition = sessionStorage.getItem(eventScrollKey);
    } catch {
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
    });

    return () => window.cancelAnimationFrame(frame);
  }, [eventScrollKey, location.key, location.state]);

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageBackLink
          to={returnPath}
          label="Volver a la cartelera"
          state={catalogOrigin ? { restoreCatalogScroll: true } : undefined}
        />

        <EventBanner
          eventName={event.nombre}
          posterUrl={event.posterReferencia}
        />

        <div
          className={
            activity
              ? "grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]"
              : "space-y-8"
          }
        >
          <div className="min-w-0 space-y-7">
            <div className="space-y-3">
              <PageHeader title="Detalles del Evento" />

              <h2 className="min-w-0 break-words text-xl font-semibold text-eventos-secondary">
                {event.nombre}
              </h2>
            </div>

            <section
              className="space-y-3"
              aria-labelledby="event-description"
            >
              <h3
                id="event-description"
                className="text-xl font-semibold text-eventos-ink"
              >
                Descripción del evento:
              </h3>

              <p className="whitespace-pre-line leading-relaxed text-eventos-body-text">
                {event.descripcion || "La descripción aún no está disponible."}
              </p>
            </section>

            {activity && <SpeakersList speakers={activity.ponentes} />}
          </div>

          {activity && (
            <ActivityInformationCard
              activity={activity}
              returnPath={`/eventos/${event.idEvento}`}
            />
          )}

          {!activity && (
            <section
              aria-label="Actividades del evento"
              className="mx-auto w-full max-w-5xl space-y-6"
            >
              {event.actividades.length > 0 ? (
                event.actividades.map((item) => (
                  <EventSessionCard
                    key={item.idSubEvento}
                    activity={item}
                    catalogReturnTo={catalogOrigin ?? undefined}
                    onOpenDetails={saveEventScroll}
                  />
                ))
              ) : (
                <p
                  role="status"
                  className="rounded-md border border-eventos-divider bg-eventos-panel-surface p-8 text-center text-eventos-muted-text"
                >
                  Este evento no tiene actividades próximas disponibles.
                </p>
              )}
            </section>
          )}
        </div>
      </div>
    </PageContainer>
  );
}