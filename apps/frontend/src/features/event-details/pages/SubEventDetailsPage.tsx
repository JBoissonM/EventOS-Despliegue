import { ArrowLeft } from "lucide-react";

import { ReservationInfoCard } from
    "../components/molecules/ReservationInfoCard";

import { SpeakersList } from
    "../components/molecules/SpeakersList";

import type {
  SubEventDetailsViewModel,
} from "../types/eventDetails.types";

export interface SubEventDetailsPageProps {
  activity: SubEventDetailsViewModel;

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
  return (
    <main
      className="
        mx-auto w-full max-w-[1280px]
        px-4 py-6
      "
    >
      <button
        type="button"
        onClick={onBack}
        className="
          inline-flex items-center gap-2
          font-merriweather text-lg font-semibold
          text-gray-950
          transition-colors
          hover:text-eventos-primary
          focus-visible:outline-2
          focus-visible:outline-offset-4
          focus-visible:outline-eventos-primary
        "
      >
        <ArrowLeft
          size={23}
          aria-hidden="true"
        />

        <span>Volver</span>
      </button>

      <div
        className="
          mt-12 grid grid-cols-1
          items-start gap-10
          lg:grid-cols-[minmax(0,1fr)_minmax(340px,0.9fr)]
        "
      >
        <div className="min-w-0 space-y-10">
          <header className="space-y-5">
            <h1
              className="
                font-merriweather
                text-3xl font-bold
                text-gray-950
              "
            >
              Detalles de la Actividad
            </h1>

            <h2
              className="
                font-merriweather
                text-xl font-semibold
                text-secondary
              "
            >
              {activity.nombre}
            </h2>
          </header>

          <section
            aria-labelledby="activity-description"
            className="space-y-8"
          >
            <h3
              id="activity-description"
              className="
                font-merriweather
                text-xl font-semibold
              "
            >
              Descripción de la Actividad:
            </h3>

            <p
              className="
                max-w-xl whitespace-pre-line
                leading-relaxed text-gray-900
              "
            >
              {activity.descripcion}
            </p>
          </section>

          <SpeakersList
            speakers={activity.ponentes}
            variant="boxed"
          />
        </div>

        <ReservationInfoCard
          activity={activity}
          kind="actividad"
          isSubmitting={isSubmitting}
          onReserve={onReserve}
        />
      </div>
    </main>
  );
}

export default SubEventDetailsPage;