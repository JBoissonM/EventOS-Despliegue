import { useState } from "react";
import { EstadoSubEvento } from "@eventos/shared";

import { EventDetailsPage } from "./EventDetailsPage";

import { useNavigate } from "react-router";

import type {
  EventActivityViewModel,
  EventDetailsViewModel,
  SpeakerViewModel,
} from "../types/eventDetails.types";

type DemoVariant = "unica" | "varias";

type DemoStatus =
  | "disponible"
  | "reservado"
  | "agotado"
  | "consultando"
  | "cancelado";

const mockSpeakers: SpeakerViewModel[] = [
  {
    idPonente: 1,
    nombre: "Ana",
    apellidoPa: "García",
    apellidoMa: "López",
  },
  {
    idPonente: 2,
    nombre: "Carlos",
    apellidoPa: "Martínez",
    apellidoMa: null,
  },
];

const singleActivity: EventActivityViewModel = {
  idEvento: 1,
  idSubEvento: 101,
  nombre: "Números Complejos",
  estado: EstadoSubEvento.ACEPTADO,
  fecha: "2026-11-05",
  horaInicio: "10:00:00",
  horaFin: "12:00:00",
  recinto: {
    idRecinto: 1,
    nombre: "Auditorio Principal",
    aforo: 160,
  },
  lugaresDisponibles: 59,
  estadoReservaUsuario: "sin-reserva",
};

const singleEvent: EventDetailsViewModel = {
  idEvento: 1,
  nombre: "Números Complejos",
  descripcion:
    "Aprende conceptos básicos sobre números " +
    "imaginarios y sus aplicaciones en ingeniería.",
  poster: null,
  actividades: [singleActivity],
};

const multipleEvent: EventDetailsViewModel = {
  idEvento: 2,
  nombre: "Feria de Sistemas Computacionales",
  descripcion:
    "Conoce los avances tecnológicos en el área " +
    "de computación, informática e inteligencia " +
    "artificial, mediante diferentes actividades " +
    "académicas y talleres.",
  poster: null,
  actividades: [
    {
      idEvento: 2,
      idSubEvento: 201,
      nombre: "Sesión TI",
      estado: EstadoSubEvento.ACEPTADO,
      fecha: "2026-11-06",
      horaInicio: "13:00:00",
      horaFin: "17:00:00",
      recinto: {
        idRecinto: 2,
        nombre: "Sala 14",
        aforo: 80,
      },
      lugaresDisponibles: 50,
      estadoReservaUsuario: "sin-reserva",
    },
    {
      idEvento: 2,
      idSubEvento: 202,
      nombre: "Taller IA",
      estado: EstadoSubEvento.ACEPTADO,
      fecha: "2026-11-07",
      horaInicio: "17:00:00",
      horaFin: "18:00:00",
      recinto: {
        idRecinto: 3,
        nombre: "Laboratorio 1104",
        aforo: 36,
      },
      lugaresDisponibles: 16,
      estadoReservaUsuario: "sin-reserva",
    },
    {
      idEvento: 2,
      idSubEvento: 203,
      nombre: "Conferencia Autómatas Celulares",
      estado: EstadoSubEvento.ACEPTADO,
      fecha: "2026-11-08",
      horaInicio: "18:00:00",
      horaFin: "20:00:00",
      recinto: {
        idRecinto: 1,
        nombre: "Auditorio Principal",
        aforo: 204,
      },
      lugaresDisponibles: 77,
      estadoReservaUsuario: "sin-reserva",
    },
  ],
};

function applyDemoStatus(
  activity: EventActivityViewModel,
  status: DemoStatus,
): EventActivityViewModel {
  return {
    ...activity,

    estado:
      status === "cancelado"
        ? EstadoSubEvento.CANCELADO
        : EstadoSubEvento.ACEPTADO,

    estadoReservaUsuario:
      status === "reservado"
        ? "reservado"
        : status === "consultando"
          ? "desconocido"
          : "sin-reserva",

    lugaresDisponibles:
      status === "agotado"
        ? 0
        : status === "consultando"
          ? null
          : activity.lugaresDisponibles,
  };
}

export function EventDetailsDemoPage() {
  const navigate = useNavigate();

  const [variant, setVariant] =
    useState<DemoVariant>("unica");

  const [status, setStatus] =
    useState<DemoStatus>("disponible");

  const [message, setMessage] = useState("");

  const baseEvent =
    variant === "unica"
      ? singleEvent
      : multipleEvent;

  const event: EventDetailsViewModel = {
    ...baseEvent,
    actividades: baseEvent.actividades.map(
      (activity) => applyDemoStatus(activity, status),
    ),
  };

  return (
    <>
      <section
        className="
          mx-auto mt-6 w-full max-w-[1280px]
          space-y-4 rounded-xl border
          border-gray-300 bg-gray-50 p-4
        "
      >
        <div>
          <h2 className="text-lg font-semibold">
            Pruebas de UI05
          </h2>

          <p className="text-sm text-gray-600">
            Datos simulados. No se realizan
            peticiones al Backend.
          </p>
        </div>

        <div className="flex flex-wrap gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">
              Tipo de evento
            </span>

            <select
              value={variant}
              onChange={(event) => {
                setVariant(
                  event.target.value as DemoVariant,
                );
                setMessage("");
              }}
              className="
                rounded-lg border border-gray-300
                bg-white px-3 py-2
              "
            >
              <option value="unica">
                Una actividad
              </option>

              <option value="varias">
                Varias actividades
              </option>
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">
              Estado de prueba
            </span>

            <select
              value={status}
              onChange={(event) => {
                setStatus(
                  event.target.value as DemoStatus,
                );
                setMessage("");
              }}
              className="
                rounded-lg border border-gray-300
                bg-white px-3 py-2
              "
            >
              <option value="disponible">
                Disponible
              </option>

              <option value="reservado">
                Ya reservado
              </option>

              <option value="agotado">
                Sin cupos
              </option>

              <option value="consultando">
                Consultando datos
              </option>

              <option value="cancelado">
                Actividad cancelada
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

      <EventDetailsPage
        event={event}
        speakers={
          variant === "unica"
            ? mockSpeakers
            : []
        }
        onBack={() => {
          setMessage(
            "Demo: el regreso a la cartelera " +
            "se conectará con React Router.",
          );
        }}

        onViewDetails={(idSubEvento) => {
          const selectedActivity = event.actividades.find(
            (activity) =>
              activity.idSubEvento === idSubEvento,
          );

          if (!selectedActivity) {
            return;
          }

          const descriptions: Record<number, string> = {
            201: "Conoce los avances en tecnologías de la información y su aplicación en las empresas.",
            202: "Aprende los fundamentos de la inteligencia artificial y sus aplicaciones.",
            203: "Introducción a los autómatas celulares y sus modelos computacionales.",
          };

          navigate(
            `/demo-actividad/${idSubEvento}`,
            {
              state: {
                activity: selectedActivity,
                description:
                  descriptions[idSubEvento] ??
                  "Descripción de la actividad.",
                ponentes: mockSpeakers,
              },
            },
          );
        }}
        onReserve={(idSubEvento) => {
          setMessage(
            `Demo: solicitud de reservación para ` +
            `el subevento ${idSubEvento}. ` +
            `No se creó ninguna reserva real.`,
          );
        }}
      />
    </>
  );
}

export default EventDetailsDemoPage;