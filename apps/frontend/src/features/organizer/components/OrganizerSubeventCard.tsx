import { useState } from "react";
import { EventSessionCard } from "../../event-details/components/molecules/EventSessionCard";
import Button from "../../../components/atoms/Button/Button";
import { Modal } from "../../../components/molecules/Modal";
import { TextArea } from "../../../components/atoms/TextArea/TextArea";
import { FormField } from "../../../components/molecules/FormField";

export interface OrganizerSubeventCardData {
  idSubEvento: number;
  nombre: string;
  descripcion: string;
  accesoQR: boolean;
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

  return (
    <>
      <EventSessionCard
        activity={{ ...subevento, idEvento }}
        detailsPath={
          detailsPath ??
          `/organizador/editar-evento/${idEvento}/subevento/${subevento.idSubEvento}`
        }
        detailsLabel={detailsLabel}
        {...(onCancel
          ? {
              actionLabel: "Cancelar",
              actionVariant: "danger" as const,
              onAction: () => {
                setMotivoCancelacion("");
                setErrorMotivo("");
                setMostrarConfirmacion(true);
              },
            }
          : onToggleDetails
            ? {
                actionLabel: detailsVisible
                  ? "Ocultar detalles"
                  : "Mostrar detalles",
                actionVariant: "primary" as const,
                onAction: onToggleDetails,
              }
          : {})}
      />
      {detailsVisible && (
        <section
          aria-labelledby={`subevento-descripcion-${subevento.idSubEvento}`}
          className="rounded-md border border-gray-200 bg-white px-5 py-4">
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
          contenido={`Ingrese el motivo de cancelación`}
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
