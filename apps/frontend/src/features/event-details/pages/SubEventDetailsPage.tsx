import { ArrowLeft } from "lucide-react";

import { SpeakersList } from "../components/molecules/SpeakersList";
import { ActivityReservationCard } from "../components/molecules/ActivityReservationCard";

import { useEventAvailability } from "../hooks/useEventAvailability";

import type {
  EventActivityViewModel,
} from "../types/eventDetails.types";

interface SubEventDetailsPageProps {
  activity: EventActivityViewModel;
  onBack: () => void;
  onReserve: (idSubEvento: number) => void;
  isSubmitting?: boolean;
}

export function SubEventDetailsPage({
                                      activity,
                                      onBack,
                                      onReserve,
                                      isSubmitting = false,
                                    }: SubEventDetailsPageProps) {
  const {
    activity: updatedActivity,
    error,
    refresh,
  } = useEventAvailability(activity);

  const currentActivity = updatedActivity ?? activity;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={onBack}
        className="mb-12 inline-flex items-center gap-2 font-merriweather text-lg font-semibold text-eventos-ink transition-colors hover:text-eventos-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-eventos-primary"
      >
        <ArrowLeft
          size={23}
          aria-hidden="true"
        />

        <span>Volver</span>
      </button>

      <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(340px,0.9fr)]">
        <div className="min-w-0 space-y-10">
          <header className="space-y-5">
            <h1 className="font-merriweather text-3xl font-bold text-eventos-ink">
              Detalles de la Actividad
            </h1>

            <h2 className="font-merriweather text-xl font-semibold text-eventos-secondary">
              {activity.nombre}
            </h2>
          </header>

          <section
            aria-labelledby="activity-description"
            className="space-y-8"
          >
            <h3
              id="activity-description"
              className="font-merriweather text-xl font-semibold text-eventos-ink"
            >
              Descripción de la Actividad:
            </h3>

            <p className="max-w-xl whitespace-pre-line leading-relaxed text-eventos-body-text">
              {activity.descripcion.trim() ||
                "La descripción de esta actividad no está disponible."}
            </p>
          </section>

          <SpeakersList
            speakers={activity.ponentes}
            variant="boxed"
          />
        </div>

        <ActivityReservationCard
          activity={currentActivity}
          kind="actividad"
          isSubmitting={isSubmitting}
          error={error}
          onReserve={onReserve}
          onRetryAvailability={refresh}
        />
      </div>
    </div>
  );
}