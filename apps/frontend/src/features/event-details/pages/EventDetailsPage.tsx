import { ArrowLeft } from "lucide-react";
import { Link } from "react-router";
import { EventBanner } from "../components/molecules/EventBanner";
import { SpeakersList } from "../components/molecules/SpeakersList";
import { EventSessionCard } from "../components/molecules/EventSessionCard";
import { ActivityInformationCard } from "../components/molecules/ActivityInformationCard";
import type { EventDetailsViewModel } from "../types/eventDetails.types";

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
  const activity = event.actividades.length === 1 ? event.actividades[0] : null;
  const returnPath = getCatalogReturnPath();
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-2 py-4 font-merriweather sm:px-6 lg:px-8">
      <Link to={returnPath} className="inline-flex items-center gap-2 rounded-md font-semibold text-eventos-ink hover:text-eventos-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-eventos-primary"><ArrowLeft size={21} aria-hidden="true"/>Volver a la cartelera</Link>
      <EventBanner eventName={event.nombre} posterUrl={event.posterReferencia} />
      <div className={activity ? "grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]" : "space-y-8"}>
        <div className="min-w-0 space-y-7">
          <header className="space-y-3">
            <h1 className="text-3xl font-bold text-eventos-ink">Detalles del Evento</h1>
            <h2 className="text-xl font-semibold text-eventos-secondary">{event.nombre}</h2>
          </header>
          <section className="space-y-3" aria-labelledby="event-description">
            <h3 id="event-description" className="text-xl font-semibold text-eventos-ink">Descripción del evento:</h3>
            <p className="whitespace-pre-line leading-relaxed text-eventos-body-text">{event.descripcion || "La descripción aún no está disponible."}</p>
          </section>
          {activity && <SpeakersList speakers={activity.ponentes} />}
        </div>
        {activity && <ActivityInformationCard activity={activity} returnPath={`/eventos/${event.idEvento}`} />}
        {!activity && (
          <section aria-label="Actividades del evento" className="mx-auto w-full max-w-5xl space-y-6">
            {event.actividades.length > 0 ? event.actividades.map((item) => <EventSessionCard key={item.idSubEvento} activity={item} />) : (
              <p role="status" className="rounded-md border border-eventos-divider bg-eventos-panel-surface p-8 text-center text-eventos-muted-text">Este evento no tiene actividades próximas disponibles.</p>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
