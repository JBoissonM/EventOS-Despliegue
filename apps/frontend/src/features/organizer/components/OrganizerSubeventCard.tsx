import { useState } from "react";
import { Link } from "react-router";
import { CalendarDays, Clock, MapPin, Users } from "lucide-react";
import Button from "../../../components/atoms/Button/Button";
import { Modal } from "../../../components/molecules/Modal";
import { TextArea } from "../../../components/atoms/TextArea/TextArea";
import { FormField } from "../../../components/molecules/FormField";

export interface OrganizerSubeventCardData {
  idSubEvento: number;
  nombre: string;
  descripcion: string;
  accesoQR: boolean;
  estado?: string;
  boletosEmitidos?: number;
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

function formatearFecha(fechaStr?: string | null): string {
  if (!fechaStr) return "-";
  const limpia = fechaStr.split("T")[0];
  const partes = limpia.split("-");
  if (partes.length === 3) {
    const [anio, mes, dia] = partes;
    return `${dia.padStart(2, "0")}/${mes.padStart(2, "0")}/${anio}`;
  }
  return fechaStr;
}

function formatearHora(horaStr?: string | null): string {
  if (!horaStr) return "-";
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
    if (motivo.length < 10) {
      setErrorMotivo("El motivo debe tener al menos 10 caracteres.");
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

  const resolvedDetailsPath =
    detailsPath ??
    (onCancel
      ? `/organizador/editar-evento/${idEvento}/subevento/${subevento.idSubEvento}`
      : undefined);

  const resolvedDetailsLabel =
    detailsLabel ?? (onCancel ? "Modificar" : "Ver detalles");

  return (
    <>
      <article className="rounded-md bg-eventos-primary-light h-fit p-6 text-gray-900 shadow-sm border border-[#E4C5C6]">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          <div className="md:col-span-5 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-merriweather font-bold text-gray-900 text-lg border-b-2 border-eventos-primary pb-0.5 inline-block">
                {subevento.nombre}
              </h3>
              {subevento.estado && (
                <span className="inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold bg-[#f8e5e8] text-primary border border-[#e8c4cb]">
                  {subevento.estado}
                </span>
              )}
            </div>
            <p className="font-merriweather text-xs sm:text-sm text-gray-700 leading-relaxed text-justify whitespace-pre-wrap">
              {subevento.descripcion}
            </p>
          </div>

          <div className="md:col-span-7 flex flex-col justify-between h-full gap-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-5 gap-x-4">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-800">
                  <MapPin className="h-4 w-4 text-gray-700 shrink-0" />
                  <span>Espacio</span>
                </div>
                <p className="mt-1 font-merriweather text-xs sm:text-sm text-gray-700">
                  {subevento.recinto?.nombre || "-"}
                </p>
              </div>

              <div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-800">
                  <CalendarDays className="h-4 w-4 text-gray-700 shrink-0" />
                  <span>Fecha</span>
                </div>
                <p className="mt-1 font-merriweather text-xs sm:text-sm text-gray-700">
                  {formatearFecha(subevento.fecha?.fecha)}
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
                  <Clock className="h-4 w-4 text-gray-700 shrink-0" />
                  <span>Hora de Inicio</span>
                </div>
                <p className="mt-1 font-merriweather text-xs sm:text-sm text-gray-700">
                  {formatearHora(subevento.fecha?.horaInicio)}
                </p>
              </div>

              <div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-800">
                  <Clock className="h-4 w-4 text-gray-700 shrink-0" />
                  <span>Hora de Finalización</span>
                </div>
                <p className="mt-1 font-merriweather text-xs sm:text-sm text-gray-700">
                  {formatearHora(subevento.fecha?.horaFin)}
                </p>
              </div>

              <div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-800">
                  <Users className="h-4 w-4 text-gray-700 shrink-0" />
                  <span>Aforo estimado</span>
                </div>
                <p className="mt-1 font-merriweather text-xs sm:text-sm text-gray-700">
                  {subevento.recinto?.aforo ?? "-"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
              {resolvedDetailsPath && (
                <Link
                  to={resolvedDetailsPath}
                  className="whitespace-nowrap rounded-md bg-eventos-primary px-4 py-2 text-sm font-semibold text-eventos-on-primary hover:bg-eventos-action-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-eventos-primary transition-colors">
                  {resolvedDetailsLabel}
                </Link>
              )}
              {onCancel && (
                <Button
                  text="Cancelar"
                  type="button"
                  variant="danger"
                  className="whitespace-nowrap rounded-md px-4 py-2 text-sm"
                  onClick={() => {
                    setMotivoCancelacion("");
                    setErrorMotivo("");
                    setMostrarConfirmacion(true);
                  }}
                />
              )}
              {onToggleDetails && (
                <Button
                  text={detailsVisible ? "Ocultar detalles" : "Mostrar detalles"}
                  type="button"
                  variant="primary"
                  className="whitespace-nowrap rounded-md px-4 py-2 text-sm"
                  onClick={onToggleDetails}
                />
              )}
            </div>
          </div>
        </div>
      </article>

      {onCancel && (
        <Modal
          titulo="Motivo de cancelación"
          contenido="Ingrese el motivo de cancelación de la actividad"
          mostrarModal={mostrarConfirmacion}
          cerrarModal={() => setMostrarConfirmacion(false)}>
          <span className="text-xs text-gray-600">Máximo 500 caracteres (mínimo 10)</span>
          <FormField errorMessage={errorMotivo}>
            <TextArea
              id={`contenedorMotivo-${subevento.idSubEvento}`}
              className="h-32 resize-none"
              value={motivoCancelacion}
              maxLength={500}
              placeholder="Ingresa el motivo de cancelación de la actividad..."
              hasError={Boolean(errorMotivo)}
              onChange={(event) => {
                const valor = event.currentTarget.value;
                setMotivoCancelacion(valor);
                if (errorMotivo) setErrorMotivo("");
              }}
            />
          </FormField>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              text="Volver"
              variant="outline"
              type="button"
              onClick={() => setMostrarConfirmacion(false)}
            />
            <Button
              text="Continuar"
              variant="primary"
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
          contenido={`¿Estás seguro de que deseas cancelar la actividad "${subevento.nombre}"?`}
          cerrarModal={() => setMostrarAviso(false)}>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              text="Volver"
              variant="outline"
              type="button"
              onClick={() => setMostrarAviso(false)}
            />
            <Button
              text="Confirmar cancelación"
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
