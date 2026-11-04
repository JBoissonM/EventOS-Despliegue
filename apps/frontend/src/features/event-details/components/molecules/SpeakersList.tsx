import type {
  EventSpeakerViewModel,
} from "../../types/eventDetails.types";

interface SpeakersListProps {
  speakers: EventSpeakerViewModel[];
  variant?: "plain" | "boxed";
}

export function SpeakersList({
                               speakers,
                               variant = "plain",
                             }: SpeakersListProps) {
  const isBoxed = variant === "boxed";

  return (
    <section className="space-y-5">
      <h2 className="font-merriweather text-2xl font-semibold text-eventos-ink">
        Lista de Ponentes
      </h2>

      {speakers.length === 0 ? (
        <p className="text-sm text-eventos-muted-text">
          Los ponentes aún no han sido publicados.
        </p>
      ) : (
        <ul
          className={
            isBoxed
              ? "w-fit min-w-64 max-w-full divide-y divide-eventos-divider border border-eventos-divider-strong"
              : "list-disc space-y-4 pl-6"
          }
        >
          {speakers.map((speaker) => (
            <li
              key={speaker.idPonente}
              className={
                isBoxed
                  ? "list-inside list-disc px-4 py-3 text-sm text-eventos-body-text"
                  : "text-sm text-eventos-body-text"
              }
            >
              {speaker.nombreCompleto}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}