import {
  AlertCircle,
  CalendarX2,
  LoaderCircle,
} from "lucide-react";

export type EventDetailsFeedbackStatus =
  | "loading"
  | "error"
  | "not-found";

export interface EventDetailsFeedbackProps {
  status: EventDetailsFeedbackStatus;
  message?: string;
  onRetry?: () => void;
  onBack?: () => void;
}

export function EventDetailsFeedback({
                                       status,
                                       message,
                                       onRetry,
                                       onBack,
                                     }: EventDetailsFeedbackProps) {
  const isLoading = status === "loading";
  const isError = status === "error";

  const title = isLoading
    ? "Cargando actividad..."
    : isError
      ? "No fue posible cargar la actividad"
      : "Actividad no encontrada";

  const description =
    message ??
    (isLoading
      ? "Estamos consultando la información."
      : isError
        ? "Ocurrió un error al obtener los datos. Inténtalo nuevamente."
        : "La actividad solicitada no existe o no está disponible.");

  return (
    <main
      className="
        mx-auto flex min-h-[400px]
        w-full max-w-3xl
        items-center justify-center
        px-4 py-10
      "
    >
      <section
        role={isError ? "alert" : "status"}
        aria-busy={isLoading}
        className="
          flex w-full flex-col items-center
          gap-5 rounded-xl border
          border-gray-200 bg-white
          p-8 text-center
        "
      >
        {isLoading ? (
          <LoaderCircle
            size={42}
            className="animate-spin text-[#5F1B36]"
            aria-hidden="true"
          />
        ) : isError ? (
          <AlertCircle
            size={42}
            className="text-[#5F1B36]"
            aria-hidden="true"
          />
        ) : (
          <CalendarX2
            size={42}
            className="text-gray-500"
            aria-hidden="true"
          />
        )}

        <h1 className="font-merriweather text-2xl font-bold">
          {title}
        </h1>

        <p className="max-w-md text-gray-600">
          {description}
        </p>

        {!isLoading && (
          <div className="flex flex-wrap justify-center gap-3">
            {isError && onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="
                  rounded-lg bg-[#5F1B36]
                  px-5 py-3 font-semibold text-white
                  hover:opacity-90
                "
              >
                Reintentar
              </button>
            )}

            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="
                  rounded-lg border border-gray-300
                  bg-white px-5 py-3
                  font-semibold text-gray-800
                  hover:bg-gray-50
                "
              >
                Volver a las actividades
              </button>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

export default EventDetailsFeedback;