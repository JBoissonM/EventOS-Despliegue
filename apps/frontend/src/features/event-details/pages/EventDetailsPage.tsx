import { ArrowLeft } from "lucide-react";

import { EventBanner } from "../components/molecules/EventBanner";
import { SpeakersList } from "../components/molecules/SpeakersList";
import { EventSessionCard } from "../components/molecules/EventSessionCard";
import { ActivityReservationCard } from "../components/molecules/ActivityReservationCard";

import { useEventAvailability } from "../hooks/useEventAvailability";

import type {
  EventActivityViewModel,
  EventDetailsViewModel,
} from "../types/eventDetails.types";

interface EventDetailsPageProps {
  event: EventDetailsViewModel;
  posterUrl?: string | null;
  onBack: () => void;
  onViewDetails: (idSubEvento: number) => void;
  onReserve: (idSubEvento: number) => void;
  isSubmitting?: boolean;
}

interface ActivityPreviewProps {
  activity: EventActivityViewModel;
  onViewDetails: (idSubEvento: number) => void;
}

interface SingleActivityReservationProps {
  activity: EventActivityViewModel;
  onReserve: (idSubEvento: number) => void;
  isSubmitting: boolean;
}

function ActivityPreview({
  activity,
  onViewDetails,
}: ActivityPreviewProps) {
  const { activity: updatedActivity } = useEventAvailability(activity);

  return (
    <EventSessionCard
      activity={updatedActivity ?? activity}
      onViewDetails={onViewDetails}
    />
  );
}

function SingleActivityReservation({
  activity,
  onReserve,
  isSubmitting,
}: SingleActivityReservationProps) {
  const {
    activity: updatedActivity,
    error,
    refresh,
  } = useEventAvailability(activity);

  return (
    <ActivityReservationCard
      activity={updatedActivity ?? activity}
      kind="evento"
      isSubmitting={isSubmitting}
      error={error}
      onReserve={onReserve}
      onRetryAvailability={refresh}
    />
  );
}

export function EventDetailsPage({
  event,
  posterUrl = null,
  onBack,
  onViewDetails,
  onReserve,
  isSubmitting = false,
}: EventDetailsPageProps) {
  const activities = event.actividades;
  const singleActivity = activities.length === 1 ? activities[0] : null;
  const hasMultipleActivities = activities.length > 1;

  const eventHeader = (
    <header className="space-y-5">
      <h1 className="font-merriweather text-3xl font-bold text-eventos-ink">
        Detalles del Evento
      </h1>
      <h2 className="font-merriweather text-xl font-semibold text-eventos-secondary">
        {event.nombre}
      </h2>
    </header>
  );

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={onBack}
        className="mb-6 inline-flex items-center gap-2 font-merriweather text-base font-semibold text-eventos-ink transition-colors hover:text-eventos-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-eventos-primary"
      >
        <ArrowLeft size={22} aria-hidden="true" />
        <span>Volver a la cartelera</span>
      </button>

      <EventBanner eventName={event.nombre} posterUrl={posterUrl} />

      <div className="mt-8 space-y-6">
        {singleActivity ? (
          <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(340px,0.9fr)]">
            <div className="min-w-0">
              {eventHeader}

              <div className="mt-6 space-y-9">
                <section
                  aria-labelledby="event-description"
                  className="space-y-4"
                >
                  <h3
                    id="event-description"
                    className="font-merriweather text-xl font-semibold text-eventos-ink"
                  >
                    Descripción del evento:
                  </h3>
                  <p className="whitespace-pre-line leading-relaxed text-eventos-body-text">
                    {event.descripcion}
                  </p>
                </section>

                <SpeakersList
                  speakers={singleActivity.ponentes}
                  variant="plain"
                />
              </div>
            </div>

            <SingleActivityReservation
              key={singleActivity.idSubEvento}
              activity={singleActivity}
              onReserve={onReserve}
              isSubmitting={isSubmitting}
            />
          </div>
        ) : (
          <>
            {eventHeader}
            <div className="space-y-10">
              <section
                aria-labelledby="event-description"
                className="space-y-4"
              >
                <h3
                  id="event-description"
                  className="font-merriweather text-xl font-semibold text-eventos-ink"
                >
                  Descripción del evento:
                </h3>
                <p className="whitespace-pre-line leading-relaxed text-eventos-body-text">
                  {event.descripcion}
                </p>
              </section>

              {hasMultipleActivities ? (
                <section
                  aria-label="Actividades del evento"
                  className="mx-auto max-w-5xl space-y-6"
                >
                  {activities.map((activity) => (
                    <ActivityPreview
                      key={activity.idSubEvento}
                      activity={activity}
                      onViewDetails={onViewDetails}
                    />
                  ))}
                </section>
              ) : (
                <div
                  role="status"
                  className="rounded-lg border border-eventos-divider bg-eventos-muted-surface p-8 text-center"
                >
                  <p className="text-eventos-muted-text">
                    Este evento no tiene actividades disponibles.
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
