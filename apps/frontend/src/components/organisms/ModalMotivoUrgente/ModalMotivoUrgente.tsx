import { useState } from "react";
import { Modal } from "../../molecules/Modal";
import { FormField } from "../../molecules/FormField";
import { TextArea } from "../../atoms/TextArea/TextArea";
import Button from "../../atoms/Button/Button";

export interface ModalMotivoUrgenteProps {
  mostrar: boolean;
  motivo: string;
  maxLength?: number;
  contenido?: string;
  onMotivoChange: (motivo: string) => void;
  cerrar: () => void;
  continuar: () => void;
}

export function ModalMotivoUrgente({
  mostrar,
  cerrar,
  motivo,
  maxLength = 500,
  contenido = "Debido a que la fecha de inicio de su evento se encuentra dentro de los próximos 7 días, deberá ingresar los motivos por los cuales su solicitud se realiza con carácter de urgencia.",
  onMotivoChange,
  continuar,
}: ModalMotivoUrgenteProps) {
  const [intentoContinuar, setIntentoContinuar] = useState(false);
  const motivoInvalido = !motivo.trim() || motivo.length > maxLength;

  const handleContinuar = () => {
    setIntentoContinuar(true);
    if (motivoInvalido) {
      return;
    }

    continuar();
  };

  return (
    <Modal
      titulo="Aviso"
      contenido={contenido}
      mostrarModal={mostrar}
      cerrarModal={cerrar}>
      <div className="space-y-4">
        <FormField label="Motivo de la urgencia" required>
          <span id="ayudaMotivoUrgente" className="text-xs text-gray-600">
            Máximo {maxLength} caracteres.
          </span>
          <TextArea
            id="campoMotivoUrgente"
            maxLength={maxLength}
            rows={4}
            className="resize-none h-50"
            value={motivo}
            hasError={intentoContinuar && motivoInvalido}
            aria-invalid={intentoContinuar && motivoInvalido}
            aria-describedby="ayudaMotivoUrgente"
            onChange={(event) => onMotivoChange(event.target.value)}
          />
          {intentoContinuar && motivoInvalido && (
            <p role="alert" className="text-sm text-red-700">
              {maxLength === 0
                ? "Reduce el motivo de modificación para dejar espacio a la justificación de urgencia."
                : "Escribe el motivo de la urgencia para continuar."}
            </p>
          )}
        </FormField>
        <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
          <Button
            text="Cancelar"
            variant="danger"
            onClick={cerrar}
            className="w-full sm:w-auto"
          />
          <Button
            text="Continuar"
            onClick={handleContinuar}
            className="w-full sm:w-auto"
          />
        </div>
      </div>
    </Modal>
  );
}
