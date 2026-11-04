import { Badge } from "../../atoms/Badge/Badge";
import { Button } from "../../atoms/Button/Button";
import { useNavigate } from "react-router";
import { AlcanceEvento } from "@eventos/shared";
import type { MisEventosItem } from "@eventos/shared";
import { EstadoEvento } from "@eventos/shared";

export function CardMenuPrincipal({
  nombre,
  posterUrl,
  idAlcance,
  idEvento,
  idEstadoEvento,
  primerSubevento,
}: MisEventosItem) {
  const estiloTexto = "font-merriweather text-base";
  const navigate = useNavigate();

  return (
    <article
      id="contenedorTarjeta"
      className="flex h-full min-h-[30rem] w-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div id="contenedorPoster" className="px-4 pt-4">
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={nombre}
            className="aspect-video w-full rounded-lg bg-gray-100 object-cover"
          />
        ) : (
          <div
            className="flex aspect-video items-center justify-center rounded-lg bg-gray-100 px-4 text-center text-sm text-gray-500"
            role="img"
            aria-label={`No hay póster para ${nombre}`}>
            Sin póster disponible
          </div>
        )}
      </div>
      <div id="contenedorDatosCard" className="flex flex-1 flex-col gap-4 p-4">
        <div id="contenedorBadges" className="flex flex-wrap justify-between gap-2">
          <Badge variant="primary">
            {idAlcance !== undefined ? AlcanceEvento[idAlcance] : "Sin alcance"}
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
            }>
            {idEstadoEvento !== undefined && EstadoEvento[idEstadoEvento]}
          </Badge>
        </div>
        <div id="contenedorTexto" className="space-y-2">
          <h2 className="break-words font-merriweather text-xl font-semibold sm:text-2xl">
            {nombre}
          </h2>
          <p className={estiloTexto}>
            Fecha: {primerSubevento?.fecha ?? "Fecha no disponible"}
          </p>
          <p className={estiloTexto}>
            Hora inicio: {primerSubevento?.horaInicio ?? "Hora no disponible"}
          </p>
          <p className={estiloTexto}>
            Hora fin: {primerSubevento?.horaFin ?? "Hora no disponible"}
          </p>
          <p className={estiloTexto}>
            Espacio: {primerSubevento?.nombreRecinto ?? "Recinto no disponible"}
          </p>
        </div>
      </div>
      <div id="contenedorBoton" className="mt-auto flex justify-end px-4 pb-4">
        <Button
          text="Ver detalles"
          variant="primary"
          type="button"
          onClick={() => navigate(`/detalles-solicitud/${idEvento}`)}
        />
      </div>
    </article>
  );
}
