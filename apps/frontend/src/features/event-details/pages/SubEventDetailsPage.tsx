import { ArrowLeft } from "lucide-react";
import { Link } from "react-router";
import { SpeakersList } from "../components/molecules/SpeakersList";
import { ActivityInformationCard } from "../components/molecules/ActivityInformationCard";
import type { EventActivityViewModel } from "../types/eventDetails.types";

interface SubEventDetailsPageProps {
  activity: EventActivityViewModel;
}

export function SubEventDetailsPage({ activity }: SubEventDetailsPageProps) {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-2 py-4 font-merriweather sm:px-6 lg:px-8">
      <Link to={`/eventos/${activity.idEvento}`} className="inline-flex items-center gap-2 rounded-md font-semibold text-eventos-ink hover:text-eventos-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-eventos-primary"><ArrowLeft size={21} aria-hidden="true" />Volver al evento</Link>
      <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]">
        <div className="min-w-0 space-y-8">
          <header className="space-y-3">
            <h1 className="text-3xl font-bold text-eventos-ink">Detalles de la Actividad</h1>
            <h2 className="text-xl font-semibold text-eventos-secondary">{activity.nombre}</h2>
          </header>
          <section aria-labelledby="activity-description" className="space-y-3">
            <h3 id="activity-description" className="text-xl font-semibold text-eventos-ink">Descripción de la actividad:</h3>
            <p className="whitespace-pre-line leading-relaxed text-eventos-body-text">{activity.descripcion.trim() || "La descripción aún no está disponible."}</p>
          </section>
          <SpeakersList speakers={activity.ponentes} variant="boxed" />
        </div>
        <ActivityInformationCard activity={activity} returnPath={`/eventos/${activity.idEvento}/actividades/${activity.idSubEvento}`} />
      </div>
    </div>
  );
}
