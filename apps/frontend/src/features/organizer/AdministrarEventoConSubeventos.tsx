import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft } from "lucide-react";
import { EventBanner } from "../event-details/components/molecules/EventBanner";
import { apiRequest } from "../../lib/apiClient";
import {
  OrganizerSubeventCard,
  type OrganizerSubeventCardData,
} from "./components/OrganizerSubeventCard";

interface EventoSubeventosVista {
  idEvento: number;
  nombre: string;
  descripcion: string;
  justificacion: string | null;
  posterUrl: string | null;
  subEventos: OrganizerSubeventCardData[];
}

function esRegistro(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null;
}

function convertirSubevento(valor: unknown): OrganizerSubeventCardData {
  if (
    !esRegistro(valor) ||
    typeof valor.idSubEvento !== "number" ||
    typeof valor.nombre !== "string" ||
    typeof valor.descripcion !== "string" ||
    typeof valor.accesoQR !== "boolean"
  ) {
    throw new Error("La respuesta contiene un subevento inválido.");
  }

  let fecha: OrganizerSubeventCardData["fecha"] = null;
  if (valor.fecha !== null) {
    if (
      !esRegistro(valor.fecha) ||
      typeof valor.fecha.fecha !== "string" ||
      typeof valor.fecha.horaInicio !== "string" ||
      typeof valor.fecha.horaFin !== "string"
    ) {
      throw new Error("La respuesta contiene una fecha de subevento inválida.");
    }
    fecha = {
      fecha: valor.fecha.fecha,
      horaInicio: valor.fecha.horaInicio,
      horaFin: valor.fecha.horaFin,
    };
  }

  let recinto: OrganizerSubeventCardData["recinto"] = null;
  if (valor.recinto !== null) {
    if (
      !esRegistro(valor.recinto) ||
      typeof valor.recinto.idRecinto !== "number" ||
      typeof valor.recinto.nombre !== "string" ||
      typeof valor.recinto.aforo !== "number"
    ) {
      throw new Error("La respuesta contiene un recinto inválido.");
    }
    recinto = {
      idRecinto: valor.recinto.idRecinto,
      nombre: valor.recinto.nombre,
      aforo: valor.recinto.aforo,
    };
  }

  return {
    idSubEvento: valor.idSubEvento,
    nombre: valor.nombre,
    descripcion: valor.descripcion,
    accesoQR: valor.accesoQR,
    estado: typeof valor.estado === "string" ? valor.estado : undefined,
    fecha,
    recinto,
  };
}

function convertirEvento(valor: unknown): EventoSubeventosVista {
  if (
    !esRegistro(valor) ||
    typeof valor.idEvento !== "number" ||
    typeof valor.nombre !== "string" ||
    typeof valor.descripcion !== "string" ||
    (typeof valor.posterUrl !== "string" && valor.posterUrl !== null) ||
    (typeof valor.justificacion !== "string" && valor.justificacion !== null) ||
    !Array.isArray(valor.subEventos)
  ) {
    throw new Error("La respuesta del evento tiene un formato inválido.");
  }

  return {
    idEvento: valor.idEvento,
    nombre: valor.nombre,
    descripcion: valor.descripcion,
    justificacion: valor.justificacion,
    posterUrl: valor.posterUrl,
    subEventos: valor.subEventos.map(convertirSubevento),
  };
}

export function AdministracionEventoConSubeventos() {
  const { idEvento } = useParams();
  const navigate = useNavigate();
  const [datosEvento, setDatosEvento] = useState<EventoSubeventosVista | null>(
    null,
  );
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const cargarEvento = async () => {
      setCargando(true);
      setError(null);
      setDatosEvento(null);

      if (!idEvento || !/^\d+$/.test(idEvento) || Number(idEvento) < 1) {
        setError("El ID del evento no es válido.");
        setCargando(false);
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        setError("Sesión no iniciada.");
        setCargando(false);
        return;
      }

      try {
        const respuesta = await apiRequest<unknown>(
          `eventos/${idEvento}/detalle-organizador`,
          { signal: controller.signal },
        );
        setDatosEvento(convertirEvento(respuesta));
      } catch (error) {
        if (controller.signal.aborted) return;
        setError(
          error instanceof Error
            ? error.message
            : "Ocurrió un error al cargar el evento.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setCargando(false);
        }
      }
    };

    void cargarEvento();
    return () => controller.abort();
  }, [idEvento]);

  const subeventosCompletos =
    datosEvento?.subEventos.filter(
      (subevento) =>
        subevento.estado !== "Cancelado" &&
        subevento.nombre.trim().length > 0 &&
        subevento.descripcion.trim().length > 0,
    ) ?? [];

  return (
    <section className="mx-auto w-full max-w-7xl space-y-8 px-4 sm:px-6 lg:space-y-10 lg:px-8">
      <button
        type="button"
        className="flex cursor-pointer items-center gap-2"
        onClick={() => navigate("/organizador/mis-eventos")}>
        <ArrowLeft size={20} aria-hidden="true" />
        <span>Volver</span>
      </button>

      <div className="space-y-4 sm:space-y-5">
        <h1 className="font-merriweather text-2xl font-semibold leading-tight sm:text-3xl lg:text-4xl">
          Administración y detalles de mi evento
        </h1>
        {datosEvento && (
          <EventBanner
            eventName={datosEvento.nombre}
            posterUrl={datosEvento.posterUrl}
          />
        )}
      </div>

      {cargando && (
        <p
          role="status"
          className="rounded-lg bg-gray-50 px-4 py-6 text-gray-600">
          Cargando detalles del evento...
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-6 text-red-700">
          {error}
        </p>
      )}

      {datosEvento && (
        <>
          <div className="space-y-5 border border-gray-200 bg-white p-5 shadow-md">
            <h2 className="font-merriweather text-xl font-bold text-secondary sm:text-2xl">
              {datosEvento.nombre}
            </h2>
            <div>
              <h2 className="font-bold">Descripción</h2>
              <p className="break-words">{datosEvento.descripcion}</p>
            </div>
            {datosEvento.justificacion && (
              <div>
                <h2 className="font-bold">Beneficio politécnico</h2>
                <p className="break-words">{datosEvento.justificacion}</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold sm:text-2xl">Actividades</h2>
            {subeventosCompletos.length > 0 ? (
              <div className="space-y-4">
                {subeventosCompletos.map((subevento) => (
                  <OrganizerSubeventCard
                    key={subevento.idSubEvento}
                    idEvento={datosEvento.idEvento}
                    subevento={subevento}
                    detailsPath={`/organizador/administrar-evento/${datosEvento.idEvento}/subevento/${subevento.idSubEvento}`}
                    detailsLabel="Mostrar detalles"
                  />
                ))}
              </div>
            ) : (
              <p className="rounded-lg bg-gray-50 px-4 py-6 text-gray-600">
                Aún no hay actividades registradas.
              </p>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() =>
                navigate(
                  `/organizador/editar-evento-subeventos/${datosEvento.idEvento}`,
                )
              }
              className="min-h-11 rounded-md bg-eventos-primary px-5 py-2 font-semibold text-eventos-on-primary hover:bg-eventos-action-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-eventos-primary">
              Modificar evento
            </button>
          </div>
        </>
      )}
    </section>
  );
}
