import { FormField } from "../../../components/molecules/FormField";
import { Modal } from "../../../components/molecules/Modal";
import { TextArea } from "../../../components/atoms/TextArea/TextArea";
import { Button } from "../../../components/atoms/Button/Button";

import type { EditLogisticsValues } from "./EditLogisticsSection";

export interface ModalMotivoProps {
  mostrarModal: boolean;
  mostrarModalAviso: boolean;
  intentoMotivo: boolean;
  logistica: EditLogisticsValues;
  onCerrar: () => void;
  onCerrarAviso: () => void;
  onCambioMotivo: (motivo: string) => void;
  onSolicitarConfirmacion: () => void;
  onConfirmar: () => void;
}
export function ModalMotivo({
  mostrarModal,
  mostrarModalAviso,
  intentoMotivo,
  logistica,
  onCerrar,
  onCerrarAviso,
  onCambioMotivo,
  onSolicitarConfirmacion,
  onConfirmar,
}: ModalMotivoProps) {
  return (
    <>
      <Modal
        mostrarModal={mostrarModal}
        titulo="Motivo de modificación logística"
        contenido="Ingresa el motivo de la modificación"
        cerrarModal={onCerrar}>
        <FormField
          label="Motivo de modificación"
          className="!font-bold !text-black"
          errorMessage={
            intentoMotivo && !logistica.motivoModificacion.trim()
              ? "El motivo de modificación es obligatorio."
              : logistica.motivoModificacion.trim().length >= 500
                ? "El motivo de modificación no puede exceder los 500 caracteres."
                : ""
          }>
          <TextArea
            id="contenedorMotivo"
            className="h-50 resize-none"
            value={logistica.motivoModificacion}
            maxLength={500}
            hasError={
              (intentoMotivo && !logistica.motivoModificacion.trim()) ||
              logistica.motivoModificacion.trim().length >= 500
            }
            onChange={(event) => onCambioMotivo(event.currentTarget.value)}
          />
        </FormField>
        <div className="flex justify-end gap-3">
          <Button
            text="Volver"
            variant="secondary"
            type="button"
            onClick={onCerrar}
          />
          <Button
            text="Continuar"
            variant="primary"
            type="button"
            onClick={onSolicitarConfirmacion}
          />
        </div>
      </Modal>

      <Modal
        mostrarModal={mostrarModalAviso}
        titulo="Confirmar modificación logística"
        contenido="Los cambios que desea realizar requieren una nueva revisión, su evento pasara a pendiente, hasta que subdirección lo vuelta autorizar. 
¿Estás seguro de que quieres realizar los cambios?"
        cerrarModal={onCerrarAviso}>
        <div className="flex justify-end gap-3">
          <Button
            text="Volver"
            variant="secondary"
            type="button"
            onClick={onCerrarAviso}
          />
          <Button
            text="Confirmar envío"
            variant="primary"
            type="button"
            onClick={onConfirmar}
          />
        </div>
      </Modal>
    </>
  );
}
