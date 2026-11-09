import { useState } from "react";
import { Link } from "react-router";
import {
  CalendarDays,
  Clock3,
  MapPin,
  UsersRound,
} from "lucide-react";
import Button from "../../../components/atoms/Button/Button";
import { Badge } from "../../../components/atoms/Badge/Badge";
import { Modal } from "../../../components/molecules/Modal";
import { TextArea } from "../../../components/atoms/TextArea/TextArea";
import { FormField } from "../../../components/molecules/FormField";
import { formatEventDate } from "../../event-details/utils/formatEventDate";

export interface OrganizerSubeventCardData {
  idSubEvento: number;
  nombre: string;
  descripcion: string;
  accesoQR: boolean;
  estado?: string;
  fecha: {
    fecha: string;
    horaInicio: string;
    horaFin: string;
  } | null;
  recinto: {
    idRecinto: number;
    nombre: string;
    aforo: number;
  } | null;
}

interface OrganizerSubeventCardProps {
  idEvento: number;
  subevento: OrganizerSubeventCardData;
  onCancel?: (motivo: string) => void;
  detailsPath?: string;
  detailsLabel?: string;
  detailsVisible?: boolean;
  onToggleDetails?: () => void;
}

function formatearHora(horaStr?: string | null): string {
  if (!horaStr) return "Por confirmar";
  const limpia = horaStr.slice(0, 5);
  return `${limpia} hrs`;
}

export function OrganizerSubeventCard({
  idEvento,
  subevento,
  onCancel,
  detailsPath,
  detailsLabel,
  detailsVisible = false,
  onToggleDetails,
}: OrganizerSubeventCardProps) {
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [motivoCancelacion, setMotivoCancelacion] = useState("");
  const [errorMotivo, setErrorMotivo] = useState("");
  const [mostrarAviso, setMostrarAviso] = useState(false);

  function continuarAConfirmacion() {
    const motivo = motivoCancelacion.trim();
    if (!motivo) {
      setErrorMotivo("El motivo de cancelación es obligatorio.");
      return;
    }
    if (motivo.length > 500) {
      setErrorMotivo("El motivo no puede exceder los 500 caracteres.");
      return;
    }

    setMostrarConfirmacion(false);
    setMostrarAviso(true);
  }

  function confirmarCancelacion() {
    const motivo = motivoCancelacion.trim();
    if (!motivo) {
      setErrorMotivo("El motivo de cancelación es obligatorio.");
      return;
    }
    if (motivo.length > 500) {
      setErrorMotivo("El motivo no puede exceder los 500 caracteres.");
      return;
    }
    onCancel?.(motivo);
    setMostrarConfirmacion(false);
    setMostrarAviso(false);
    setMotivoCancelacion("");
    setErrorMotivo("");
  }

  const horaInicioFormateada = subevento.fecha?.horaInicio
    ? formatearHora(subevento.fecha.horaInicio)
    : "Por confirmar";
  const horaFinFormateada = subevento.fecha?.horaFin
    ? formatearHora(subevento.fecha.horaFin)
    : "Por confirmar";

  return (
    <>
      <article className="rounded-md bg-eventos-primary-light h-fit p-6 text-gray-900 shadow-sm border border-[#E4C5C6]">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Columna Izquierda: Título, estado y descripción */}
          <div className="md:col-span-5 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-merriweather text-base sm:text-lg font-bold text-gray-900">
                {subevento.nombre}
              </h3>
              {subevento.estado && (
                <Badge
                  variant={
                    subevento.estado === "Activo" ||
                    subevento.estado === "Aprobado"
                      ? "success"
                      : subevento.estado === "Cancelado"
                        ? "error"
                        : "primary"
                  }>
                  {subevento.estado}
                </Badge>
              )}
            </div>
            <p className="font-merriweather text-xs sm:text-sm text-gray-700 leading-relaxed text-justify">
              {subevento.descripcion}
            </p>
          </div>

          {/* Columna Derecha: Cuadrícula de 6 datos con iconos */}
          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-y-5 gap-x-4">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-800">
                <MapPin className="h-4 w-4 text-gray-700 shrink-0" />
                <span>Espacio</span>
              </div>
              <p className="mt-1 font-merriweather text-xs sm:text-sm text-gray-700">
                {subevento.recinto?.nombre ?? "Por confirmar"}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-800">
                <CalendarDays className="h-4 w-4 text-gray-700 shrink-0" />
                <span>Fecha</span>
              </div>
              <p className="mt-1 font-merriweather text-xs sm:text-sm text-gray-700">
                {formatEventDate(subevento.fecha?.fecha)}
              </p>
            </div>

            <div>
              <div className="text-xs font-semibold text-gray-800">
                Modalidad de cupo
              </div>
              <p className="mt-1 font-merriweather text-xs sm:text-sm text-gray-700">
                {subevento.accesoQR ? "Boleto con QR" : "Acceso libre"}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-800">
                <Clock3 className="h-4 w-4 text-gray-700 shrink-0" />
                <span>Hora de Inicio</span>
              </div>
              <p className="mt-1 font-merriweather text-xs sm:text-sm text-gray-700">
                {horaInicioFormateada}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-800">
                <Clock3 className="h-4 w-4 text-gray-700 shrink-0" />
                <span>Hora de Finalización</span>
              </div>
              <p className="mt-1 font-merriweather text-xs sm:text-sm text-gray-700">
                {horaFinFormateada}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-800">
                <UsersRound className="h-4 w-4 text-gray-700 shrink-0" />
                <span>Aforo estimado</span>
              </div>
              <p className="mt-1 font-merriweather text-xs sm:text-sm text-gray-700">
                {subevento.recinto?.aforo !== undefined
                  ? `${subevento.recinto.aforo} personas`
                  : "Por confirmar"}
              </p>
            </div>
          </div>
        </div>

        {/* Fila inferior de acciones con subrayado/borde superior rojizo */}
        <div className="mt-5 flex flex-wrap items-center justify-end gap-3 border-t border-[#E4C5C6] pt-4">
          {onCancel ? (
            <>
              <Link
                to={
                  detailsPath ??
                  `/organizador/editar-evento/${idEvento}/subevento/${subevento.idSubEvento}`
                }
                className="whitespace-nowrap rounded-md bg-eventos-primary px-5 py-2.5 text-sm font-semibold text-eventos-on-primary hover:bg-eventos-action-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-eventos-primary">
                Modificar
              </Link>
              <Button
                text="Cancelar"
                type="button"
                variant="danger"
                className="whitespace-nowrap rounded-md px-5 py-2.5 text-sm"
                onClick={() => {
                  setMotivoCancelacion("");
                  setErrorMotivo("");
                  setMostrarConfirmacion(true);
                }}
              />
            </>
          ) : (
            <>
              {detailsPath && (
                <Link
                  to={detailsPath}
                  className="whitespace-nowrap rounded-md bg-eventos-primary px-5 py-2.5 text-sm font-semibold text-eventos-on-primary hover:bg-eventos-action-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-eventos-primary">
                  {detailsLabel ?? "Mostrar detalles"}
                </Link>
              )}
              {onToggleDetails && (
                <Button
                  text={
                    detailsLabel ??
                    (detailsVisible ? "Ocultar detalles" : "Mostrar detalles")
                  }
                  type="button"
                  variant="primary"
                  className="whitespace-nowrap rounded-md px-5 py-2.5 text-sm"
                  onClick={onToggleDetails}
                />
              )}
            </>
          )}
        </div>
      </article>

      {detailsVisible && (
        <section
          aria-labelledby={`subevento-descripcion-${subevento.idSubEvento}`}
          className="rounded-md border border-[#E4C5C6] bg-white px-5 py-4 shadow-sm">
          <h4
            id={`subevento-descripcion-${subevento.idSubEvento}`}
            className="font-semibold text-eventos-ink">
            Descripción de la actividad
          </h4>
          <p className="mt-2 whitespace-pre-wrap break-words text-sm text-eventos-body-text">
            {subevento.descripcion}
          </p>
        </section>
      )}

      {onCancel && (
        <Modal
          titulo="Motivo de cancelación"
          contenido="Ingrese el motivo de cancelación"
          mostrarModal={mostrarConfirmacion}
          cerrarModal={() => setMostrarConfirmacion(false)}>
          <span className="text-xs">Máximo 500 caracteres</span>
          <FormField errorMessage={errorMotivo}>
            <TextArea
              id="contenedorMotivo"
              className="h-50 resize-none"
              value={motivoCancelacion}
              maxLength={500}
              hasError={Boolean(errorMotivo)}
              onChange={(event) => {
                const valor = event.currentTarget.value;
                setMotivoCancelacion(valor);
                if (errorMotivo) setErrorMotivo("");
              }}
            />
          </FormField>

          <div className="flex justify-end gap-3">
            <Button
              text="Volver"
              variant="secondary"
              type="button"
              onClick={() => setMostrarConfirmacion(false)}
            />
            <Button
              text="Aceptar"
              variant="success"
              type="button"
              onClick={continuarAConfirmacion}
            />
          </div>
        </Modal>
      )}

      {mostrarAviso && (
        <Modal
          mostrarModal={mostrarAviso}
          titulo="Confirmar cancelación"
          contenido={`Estás seguro que deseas cancelar la actividad ${subevento.nombre}`}
          cerrarModal={() => setMostrarAviso(false)}>
          <div className="flex justify-end gap-3">
            <Button
              text="Volver"
              variant="secondary"
              type="button"
              onClick={() => setMostrarAviso(false)}
            />
            <Button
              text="Cancelar"
              variant="danger"
              type="button"
              onClick={confirmarCancelacion}
            />
          </div>
        </Modal>
      )}
    </>
  );
}
