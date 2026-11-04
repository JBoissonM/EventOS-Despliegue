import { useState } from "react";
import { TextArea } from "../../atoms/TextArea/TextArea";
import { Button } from "../../atoms/Button/Button";
import { Input } from "../../atoms/Input/Input";
import { Modal } from "../../molecules/Modal";
import { FormField } from "../../molecules/FormField";
import type { ErroresSubevento } from "../../../features/events/SolicitudEventos";

export interface ModalSubeventoProps {
  mostrar: boolean;
  nombre: string;
  descripcion: string;
  errores: ErroresSubevento;
  cambiarNombre: (valor: string) => void;
  cambiarDescripcion: (valor: string) => void;
  cerrar: () => void;
}

export function ModalSubevento({
  mostrar,
  cerrar,
  nombre,
  cambiarNombre,
  errores: errors,
  cambiarDescripcion,
  descripcion,
}: ModalSubeventoProps) {
  const [guardarIntentado, setGuardarIntentado] = useState(false);
  const errorNombre =
    errors.nombre ??
    (guardarIntentado && !nombre.trim()
      ? "El nombre del subevento es obligatorio"
      : undefined);
  const errorDescripcion =
    errors.descripcion ??
    (guardarIntentado && !descripcion.trim()
      ? "La descripción del subevento es obligatoria"
      : undefined);

  const cerrarModal = () => {
    setGuardarIntentado(false);
    cerrar();
  };

  const guardar = () => {
    setGuardarIntentado(true);
    if (
      !nombre.trim() ||
      !descripcion.trim() ||
      errors.nombre ||
      errors.descripcion
    ) {
      return;
    }

    cerrarModal();
  };

  return (
    <Modal
      titulo="Detalles del subevento"
      contenido="Agrega los detalles del subevento"
      mostrarModal={mostrar}
      cerrarModal={cerrarModal}>
      <div id="contenedorModalSubevento" className="grid grid-cols-1 gap-1">
        <FormField
          required
          label="Nombre del subevento"
          errorMessage={errorNombre}>
          <Input
            id="campoNombreSubevento"
            type="text"
            placeholder="Ingresa el nombre del subevento"
            value={nombre}
            hasError={Boolean(errorNombre)}
            onChange={(e) => cambiarNombre(e.target.value)}
            maxLength={150}
          />
        </FormField>
        <FormField
          required
          label="Descripción"
          errorMessage={errorDescripcion}>
          <TextArea
            id="campoDescripcionSubevento"
            placeholder="Ingresa la descripción del subevento"
            maxLength={500}
            className="resize-none h-50"
            value={descripcion}
            hasError={Boolean(errorDescripcion)}
            onChange={(e) => cambiarDescripcion(e.target.value)}
          />
        </FormField>
        <Button text="Guardar" className="justify-self-end" onClick={guardar} />
      </div>
    </Modal>
  );
}
