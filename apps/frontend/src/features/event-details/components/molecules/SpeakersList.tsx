import type { EventSpeakerViewModel } from "../../types/eventDetails.types";

interface SpeakersListProps {
  speakers: EventSpeakerViewModel[];
}

export function SpeakersList({ speakers }: SpeakersListProps) {
  return (
    <section className="space-y-4">
      <h3 className="font-merriweather text-xl font-semibold text-eventos-ink">
        {speakers.length === 1 ? "Ponente" : "Ponentes"}
      </h3>

      {speakers.length === 0 ? (
        <p className="text-sm text-eventos-muted-text">
          Los ponentes aún no han sido publicados.
        </p>
      ) : (
        <ul className="list-disc space-y-2 pl-6">
          {speakers.map((speaker) => (
            <li
              key={speaker.idPonente}
              className="text-sm leading-relaxed text-eventos-body-text"
            >
              {speaker.nombreCompleto}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}