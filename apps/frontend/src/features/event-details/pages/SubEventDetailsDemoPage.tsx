import { useState } from "react";
import {
  useLocation,
  useNavigate,
  useParams,
} from "react-router";

import { SubEventDetailsPage } from "./SubEventDetailsPage";
import { EventDetailsFeedback } from "../components/molecules/EventDetailsFeedback";

import type {
  EventActivityViewModel,
  SpeakerViewModel,
  SubEventDetailsViewModel,
} from "../types/eventDetails.types";

interface DemoNavigationState {
  activity: EventActivityViewModel;
  description: string;
  ponentes: SpeakerViewModel[];
}

export function SubEventDetailsDemoPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { idSubEvento } = useParams();

  const [message, setMessage] = useState("");

  const [previewStatus, setPreviewStatus] =
    useState<"ready" | "loading" | "error">("ready");

  const demoState =
    location.state as DemoNavigationState | null;

  if (
    !demoState?.activity ||
    String(demoState.activity.idSubEvento) !== idSubEvento
  ) {
    return (
      <main
        className="
          mx-auto max-w-3xl
          space-y-4 px-4 py-10
        "
      >
        <h1 className="text-2xl font-bold">
          Actividad no seleccionada
        </h1>

        <p className="text-gray-600">
          Esta demostración necesita que selecciones
          una actividad desde UI05.
        </p>

        <button
          type="button"
          onClick={() => navigate("/demo-evento")}
          className="
            rounded-lg bg-[#5F1B36]
            px-5 py-3 font-semibold text-white
          "
        >
          Ir a UI05
        </button>
      </main>
    );
  }

  const activity: SubEventDetailsViewModel = {
    ...demoState.activity,
    descripcion: demoState.description,
    accesoQR: true,
    ponentes: demoState.ponentes,
  };


  return (
    <>
      <section
        className="
        mx-auto mt-5 w-full max-w-[1280px]
        space-y-3 px-4
      "
      >
        <div
          className="
          flex flex-wrap items-end gap-4
          rounded-lg border border-gray-300
          bg-gray-50 p-4
        "
        >
          <div className="flex-1 space-y-1">
            <h2 className="font-semibold">
              Pruebas de UI05.1
            </h2>

            <p className="text-sm text-gray-600">
              Datos simulados. No se realizan
              solicitudes al Backend.
            </p>
          </div>

          <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">
            Estado de la página
          </span>

            <select
              value={previewStatus}
              onChange={(event) => {
                setPreviewStatus(
                  event.target.value as
                    "ready" | "loading" | "error",
                );
                setMessage("");
              }}
              className="
              rounded-lg border border-gray-300
              bg-white px-3 py-2
            "
            >
              <option value="ready">
                Datos cargados
              </option>

              <option value="loading">
                Cargando
              </option>

              <option value="error">
                Error del servidor
              </option>
            </select>
          </label>
        </div>

        {message && (
          <p
            role="status"
            className="
            rounded-lg border border-gray-300
            bg-white p-3 text-sm
          "
          >
            {message}
          </p>
        )}
      </section>

      {previewStatus === "ready" ? (
        <SubEventDetailsPage
          activity={activity}
          onBack={() => navigate(-1)}
          onReserve={(id) => {
            setMessage(
              `Demo: reservar la actividad ${id}. ` +
              "No se creó ninguna reservación real.",
            );
          }}
        />
      ) : (
        <EventDetailsFeedback
          status={previewStatus}
          onRetry={() => setPreviewStatus("ready")}
          onBack={() => navigate("/demo-evento")}
        />
      )}
    </>
  );
}

export default SubEventDetailsDemoPage;