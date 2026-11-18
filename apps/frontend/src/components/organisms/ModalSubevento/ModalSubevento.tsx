import { useEffect, useState } from "react";
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

  // Reiniciar estado de intento al abrir o cerrar el modal
  useEffect(() => {
    if (mostrar) {
      setGuardarIntentado(false);
    }
  }, [mostrar]);

  // Solo mostrar error de vacío si el usuario ya intentó guardar dentro del modal
  const errorNombre = (() => {
    if (!nombre.trim()) {
      return guardarIntentado
        ? "El nombre del subevento es obligatorio"
        : undefined;
    }
    if (nombre.trim().length > 150) {
      return "El nombre del subevento no debe exceder los 150 caracteres";
    }
    return errors.nombre &&
      errors.nombre !== "El nombre del subevento es obligatorio"
      ? errors.nombre
      : undefined;
  })();

  const errorDescripcion = (() => {
    if (!descripcion.trim()) {
      return guardarIntentado
        ? "La descripción del subevento es obligatoria"
        : undefined;
    }
    if (descripcion.trim().length < 10) {
      return "La descripción del subevento debe tener al menos 10 caracteres";
    }
    if (descripcion.trim().length > 500) {
      return "La descripción del subevento no debe exceder los 500 caracteres";
    }
    return errors.descripcion &&
      errors.descripcion !== "La descripción del subevento es obligatoria"
      ? errors.descripcion
      : undefined;
  })();

  const cerrarModal = () => {
    setGuardarIntentado(false);
    cerrar();
  };

  const guardar = () => {
    setGuardarIntentado(true);
    if (
      !nombre.trim() ||
      !descripcion.trim() ||
      nombre.trim().length > 150 ||
      descripcion.trim().length < 10 ||
      descripcion.trim().length > 500
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
      cerrarModal={cerrarModal}
    >
      <div id="contenedorModalSubevento" className="grid grid-cols-1 gap-1">
        <FormField
          required
          label="Nombre del subevento"
          errorMessage={errorNombre}
        >
          <span className="text-xs text-gray-700">
            Máximo 150 caracteres
          </span>
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
        <FormField required label="Descripción" errorMessage={errorDescripcion}>
          <span className="text-xs text-gray-700">
            Máximo 500 caracteres y mínimo 10 caracteres
          </span>
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
