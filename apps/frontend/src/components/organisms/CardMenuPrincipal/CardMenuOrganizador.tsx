import { useState } from "react";
import { Badge } from "../../atoms/Badge/Badge";
import { Button } from "../../atoms/Button/Button";
import { useNavigate } from "react-router";
import { CalendarDays, Clock3, MapPin } from "lucide-react";
import { AlcanceEvento } from "@eventos/shared";
import type { MisEventosItem } from "@eventos/shared";
import { EstadoEvento } from "@eventos/shared";
import {
  formatearFechaDdMmAaaa,
  formatearHorarioRango,
} from "../../../utils/fechaHorario";
import { resolverUrlPoster } from "../../../utils/posterUrl";

export function CardMenuPrincipal({
  nombre,
  posterUrl,
  idAlcance,
  idEvento,
  idEstadoEvento,
  subeventos,
}: MisEventosItem) {
  const [failedPoster, setFailedPoster] = useState<string | null>(null);
  const estiloTexto = "font-merriweather text-[14px]";
  const navigate = useNavigate();
  const primerSubevento = subeventos?.[0];
  const ultimoSubevento = subeventos?.[subeventos.length - 1];
  const tieneUnSubevento = subeventos?.length === 1;
  const espacios = [
    ...new Set(
      (subeventos ?? [])
        .map((sub) => sub.nombreRecinto)
        .filter((recinto): recinto is string => Boolean(recinto)),
    ),
  ];

  const poster = resolverUrlPoster(posterUrl);
  const imageAvailable = poster !== null && failedPoster !== poster;

  return (
    <article
      id="contenedorTarjeta"
      className="flex h-full min-w-0 flex-col overflow-hidden rounded-lg border border-eventos-panel-border bg-eventos-surface shadow-sm transition-shadow hover:shadow-md"
    >
      <div id="contenedorPoster" className="px-4 pt-4">
        {imageAvailable ? (
          <img
            src={poster}
            alt={nombre}
            className="aspect-video w-full rounded-lg bg-gray-100 object-cover"
            onError={() => setFailedPoster(poster)}
          />
        ) : (
          <div
            className="flex aspect-video items-center justify-center rounded-lg bg-gray-100 px-4 text-center text-sm text-gray-500"
            role="img"
            aria-label={`No hay póster para ${nombre}`}
          >
            Sin póster disponible
          </div>
        )}
      </div>
      <div id="contenedorDatosCard" className="flex flex-1 flex-col gap-4 p-4">
        <div
          id="contenedorBadges"
          className="flex flex-wrap justify-between gap-2"
        >
          <Badge
            variant={
              idAlcance == 1
                ? "scope-public"
                : idAlcance == 2
                  ? "scope-internal"
                  : idAlcance == 3
                    ? "scope-private"
                    : "primary"
            }
          >
            {idAlcance !== undefined && idAlcance === 1
              ? "Público"
              : idAlcance !== undefined && idAlcance === 2
                ? "Interno"
                : idAlcance !== undefined && idAlcance === 3
                  ? "Privado"
                  : "Sin alcance"}
          </Badge>
          <Badge
            variant={
              idEstadoEvento == 1
                ? "error"
                : idEstadoEvento == 2
                  ? "success"
                  : idEstadoEvento === 3
                    ? "warning"
                    : idEstadoEvento === 4
                      ? "primary"
                      : "error"
            }
          >
            {idEstadoEvento == 1
              ? "Rechazado"
              : idEstadoEvento == 2
                ? "Aceptado"
                : idEstadoEvento == 3
                  ? "Pendiente"
                  : idEstadoEvento == 4
                    ? "Cancelado"
                    : ""}
          </Badge>
        </div>
        <div id="contenedorTexto" className="space-y-2">
          <h2 className="break-words font-merriweather text-xl font-semibold sm:text-[18px]">
            {nombre}
          </h2>
          {tieneUnSubevento ||
          primerSubevento?.fecha === ultimoSubevento?.fecha ? (
            <p className={`${estiloTexto} flex items-start gap-1.5`}>
              <CalendarDays size={16} className="mt-0.5 shrink-0 text-eventos-body-text" aria-hidden="true" />
              <span>
                <strong>Fecha:</strong>{" "}
                {formatearFechaDdMmAaaa(
                  primerSubevento?.fecha,
                  "Fecha no disponible",
                )}
              </span>
            </p>
          ) : (
            <>
              <p className={`${estiloTexto} flex items-start gap-1.5`}>
                <CalendarDays size={16} className="mt-0.5 shrink-0 text-eventos-body-text" aria-hidden="true" />
                <span>
                  <strong>Fecha inicio:</strong>{" "}
                  {formatearFechaDdMmAaaa(
                    primerSubevento?.fecha,
                    "Fecha no disponible",
                  )}
                </span>
              </p>
              <p className={`${estiloTexto} flex items-start gap-1.5`}>
                <CalendarDays size={16} className="mt-0.5 shrink-0 text-eventos-body-text" aria-hidden="true" />
                <span>
                  <strong>Fecha fin:</strong>{" "}
                  {formatearFechaDdMmAaaa(
                    ultimoSubevento?.fecha,
                    "Fecha no disponible",
                  )}
                </span>
              </p>
            </>
          )}
          {tieneUnSubevento && (
            <p className={`${estiloTexto} flex items-start gap-1.5`}>
              <Clock3 size={16} className="mt-0.5 shrink-0 text-eventos-body-text" aria-hidden="true" />
              <span>
                <strong>Horario:</strong>{" "}
                {formatearHorarioRango(
                  primerSubevento?.horaInicio,
                  primerSubevento?.horaFin,
                  "Hora no disponible",
                )}
              </span>
            </p>
          )}
          <p className={`${estiloTexto} flex items-start gap-1.5`}>
            <MapPin size={16} className="mt-0.5 shrink-0 text-eventos-body-text" aria-hidden="true" />
            <span>
              <strong>{espacios.length > 1 ? "Espacios:" : "Espacio:"}</strong>{" "}
              {espacios.length > 0
                ? espacios.join(", ")
                : "Recinto no disponible"}
            </span>
          </p>
        </div>
      </div>
      <div id="contenedorBoton" className="mt-auto flex justify-end px-4 pb-4">
        <Button
          text="Ver detalles"
          variant="primary"
          type="button"
          onClick={() => {
            tieneUnSubevento
              ? navigate(`/organizador/administrar-evento/${idEvento}`)
              : navigate(
                  `/organizador/administrar-evento-subeventos/${idEvento}`,
                );
          }}
        />
      </div>
    </article>
  );
}
