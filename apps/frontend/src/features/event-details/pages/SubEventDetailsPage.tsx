import { useLocation } from "react-router";
import { PageBackLink } from "../../../components/molecules/PageBackLink";
import { PageContainer } from "../../../components/templates/PageContainer";
import { PageHeader } from "../../../components/organisms/PageHeader/PageHeader";
import { SpeakersList } from "../components/molecules/SpeakersList";
import { ActivityInformationCard } from "../components/molecules/ActivityInformationCard";
import { getCatalogOrigin } from "../../event-catalog/utils/catalogNavigation";
import type { EventActivityViewModel } from "../types/eventDetails.types";

interface SubEventDetailsPageProps {
  activity: EventActivityViewModel;
}

export function SubEventDetailsPage({ activity }: SubEventDetailsPageProps) {
  const location = useLocation();
  const catalogOrigin = getCatalogOrigin(location.state);
  const shouldRestoreEventScroll =
    typeof location.state === "object" &&
    location.state !== null &&
    !Array.isArray(location.state) &&
    (location.state as Record<string, unknown>).restoreEventScroll === true;

  return (
    <PageContainer>
      <div className="space-y-4">
        <PageBackLink
          to={`/eventos/${activity.idEvento}`}
          label="Volver al evento"
          state={
            catalogOrigin || shouldRestoreEventScroll
              ? {
                ...(catalogOrigin ? { catalogReturnTo: catalogOrigin } : {}),
                ...(shouldRestoreEventScroll
                  ? { restoreEventScroll: true }
                  : {}),
              }
              : undefined
          }
        />

        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]">
          <div className="min-w-0 space-y-8">
            <div className="space-y-3">
              <PageHeader title="Detalles de la Actividad" />

              <h2 className="min-w-0 break-words text-xl font-semibold text-eventos-secondary">
                {activity.nombre}
              </h2>
            </div>

            <section
              aria-labelledby="activity-description"
              className="space-y-3"
            >
              <h3
                id="activity-description"
                className="text-xl font-semibold text-eventos-ink"
              >
                Descripción de la actividad:
              </h3>

              <p className="whitespace-pre-line leading-relaxed text-eventos-body-text">
                {activity.descripcion.trim() ||
                  "La descripción aún no está disponible."}
              </p>
            </section>

            <SpeakersList speakers={activity.ponentes} />
          </div>

          <ActivityInformationCard
            activity={activity}
            returnPath={`/eventos/${activity.idEvento}/actividades/${activity.idSubEvento}`}
          />
        </div>
      </div>
    </PageContainer>
  );
}