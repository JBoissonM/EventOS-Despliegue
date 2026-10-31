import type {
  SpeakerViewModel,
} from "../../types/eventDetails.types";

export interface SpeakersListProps {
  speakers: SpeakerViewModel[];
  variant?: "plain" | "boxed";
}

export function SpeakersList({
                               speakers,
                               variant = "plain",
                             }: SpeakersListProps) {
  const isBoxed = variant === "boxed";

  return (
    <section className="space-y-5">
      <h2 className="font-merriweather text-2xl font-bold">
        Lista de Ponentes
      </h2>

      {speakers.length === 0 ? (
        <p className="text-sm text-gray-600">
          Los ponentes aún no han sido publicados.
        </p>
      ) : (
        <ul
          className={
            isBoxed
              ? "w-fit min-w-64 max-w-full divide-y divide-gray-300 border border-gray-400"
              : "list-disc space-y-4 pl-6"
          }
        >
          {speakers.map((speaker) => {
            const fullName = [
              speaker.nombre,
              speaker.apellidoPa,
              speaker.apellidoMa,
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <li
                key={speaker.idPonente}
                className={
                  isBoxed
                    ? "px-4 py-2 text-sm"
                    : "text-sm"
                }
              >
                {fullName}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default SpeakersList;