import { ArrowLeft } from "lucide-react";

import { EventBanner } from "../components/molecules/EventBanner";
import { EventSessionCard } from "../components/molecules/EventSessionCard";
import { ReservationInfoCard } from "../components/molecules/ReservationInfoCard";
import { SpeakersList } from "../components/molecules/SpeakersList";

import type {
  EventDetailsViewModel,
  SpeakerViewModel,
} from "../types/eventDetails.types";

export interface EventDetailsPageProps {
  event: EventDetailsViewModel;
  speakers?: SpeakerViewModel[];

  onBack: () => void;
  onViewDetails: (idSubEvento: number) => void;
  onReserve: (idSubEvento: number) => void;

  isSubmitting?: boolean;
}

export function EventDetailsPage({
                                   event,
                                   speakers = [],
                                   onBack,
                                   onViewDetails,
                                   onReserve,
                                   isSubmitting = false,
                                 }: EventDetailsPageProps) {
  const activities = event.actividades;

  const singleActivity =
    activities.length === 1
      ? (activities[0] ?? null)
      : null;

  return (
    <main className="mx-auto w-full max-w-[1280px] px-4 py-6">
      <button
        type="button"
        onClick={onBack}
        className="
          mb-5 inline-flex items-center gap-2
          font-merriweather text-lg font-semibold
          text-gray-950
          transition-colors
          hover:text-eventos-primary
          focus-visible:outline-2
          focus-visible:outline-offset-4
          focus-visible:outline-eventos-primary
        "
      >
        <ArrowLeft size={23} aria-hidden="true" />
        <span>Volver a la cartelera</span>
      </button>

      <EventBanner
        eventName={event.nombre}
        posterUrl={event.poster}
      />

      {singleActivity ? (
        <div
          className="
            mt-8 grid grid-cols-1 items-start gap-8
            lg:grid-cols-[minmax(0,1fr)_minmax(340px,0.9fr)]
          "
        >
          <div className="min-w-0 space-y-7">
            <header className="space-y-5">
              <h1
                className="
                  font-merriweather
                  text-3xl font-bold
                  text-gray-950
                "
              >
                Detalles del Evento
              </h1>

              <h2
                className="
                  font-merriweather
                  text-xl font-semibold
                  text-secondary
                "
              >
                {event.nombre}
              </h2>
            </header>

            <section
              aria-labelledby="event-description"
              className="space-y-5"
            >
              <h3
                id="event-description"
                className="
                  font-merriweather
                  text-xl font-semibold
                "
              >
                Descripción del evento:
              </h3>

              <p
                className="
                  max-w-xl whitespace-pre-line
                  leading-relaxed
                  text-gray-900
                "
              >
                {event.descripcion}
              </p>
            </section>

            <SpeakersList
              speakers={speakers}
              variant="plain"
            />
          </div>

          <ReservationInfoCard
            activity={singleActivity}
            kind="evento"
            isSubmitting={isSubmitting}
            onReserve={onReserve}
          />
        </div>
      ) : (
        <div className="mt-7 space-y-6">
          <header className="space-y-4">
            <h1
              className="
                font-merriweather
                text-3xl font-bold
                text-gray-950
              "
            >
              Detalles del Evento
            </h1>

            <h2
              className="
                font-merriweather
                text-xl font-semibold
                text-secondary
              "
            >
              {event.nombre}
            </h2>
          </header>

          <section
            aria-labelledby="event-description"
            className="space-y-5"
          >
            <h3
              id="event-description"
              className="
                font-merriweather
                text-xl font-semibold
              "
            >
              Descripción del evento:
            </h3>

            <p
              className="
                whitespace-pre-line
                leading-relaxed text-gray-900
              "
            >
              {event.descripcion}
            </p>
          </section>

          {activities.length > 0 ? (
            <section
              aria-label="Actividades del evento"
              className="
                mx-auto max-w-[1000px]
                space-y-6 pt-5
              "
            >
              {activities.map((activity) => (
                <EventSessionCard
                  key={activity.idSubEvento}
                  activity={activity}
                  onViewDetails={onViewDetails}
                />
              ))}
            </section>
          ) : (
            <p
              role="status"
              className="
                rounded-lg border
                border-eventos-neutral
                p-5 text-center
                text-gray-600
              "
            >
              Este evento no tiene actividades disponibles.
            </p>
          )}
        </div>
      )}
    </main>
  );
}

export default EventDetailsPage;