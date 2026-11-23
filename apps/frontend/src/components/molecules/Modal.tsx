import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  titulo: string;
  contenido?: string;
  children?: ReactNode;
  mostrarModal: boolean;
  cerrarModal: () => void;
  ancho?: "normal" | "amplio";
}

export function Modal({
  titulo,
  contenido,
  children,
  mostrarModal,
  cerrarModal,
  ancho = "normal",
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const tituloId = useId();
  const contenidoId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (mostrarModal && !dialog.open) {
      dialog.showModal();
      dialog.focus();
    } else if (!mostrarModal && dialog.open) {
      dialog.close();
    }
  }, [mostrarModal]);

  const dialogNode = (
    <dialog
      ref={dialogRef}
      tabIndex={-1}
      aria-labelledby={tituloId}
      aria-describedby={contenidoId}
      onCancel={cerrarModal}
      onClick={(event) => {
        if (event.target === event.currentTarget) cerrarModal();
      }}
      className={`rounded-md m-auto w-[calc(100%-2rem)] ${
        ancho === "amplio" ? "max-w-2xl" : "max-w-lg"
      } border-0 bg-gray p-0 text-gray-900 backdrop:bg-black/50`}
    >
      <div className="bg-white p-6 text-left shadow-xl sm:p-8 space-y-5">
        <h2
          id={tituloId}
          className="text-lg sm:text-1xl md:text-2xl font-merriweather font-bold"
        >
          {titulo}
        </h2>
        <p
          id={contenidoId}
          className="text-sm md:text-base font-merriweather text-left"
        >
          {contenido}
        </p>
        {children}
      </div>
    </dialog>
  );

  return typeof document !== "undefined"
    ? createPortal(dialogNode, document.body)
    : dialogNode;
}
