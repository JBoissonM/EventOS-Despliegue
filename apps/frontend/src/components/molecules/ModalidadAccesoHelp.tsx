import { Info } from "lucide-react";
import {
  DESCRIPCIONES_MODALIDAD,
  esLaboratorioRecinto,
  ETIQUETAS_MODALIDAD,
  ModalidadAcceso,
  RecintoId,
} from "@eventos/shared";

interface ModalidadAccesoHelpProps {
  idRecinto?: number;
  idModalidadAcceso?: ModalidadAcceso;
  className?: string;
}

function obtenerNotaRecinto(idRecinto?: number): string | null {
  if (!idRecinto) return null;
  if (esLaboratorioRecinto(idRecinto)) {
    return "Por control de equipos, los laboratorios utilizan únicamente QR Admisión general.";
  }
  if (idRecinto === RecintoId.SALA_14) {
    return "Sala 14 permite Acceso libre, Registro simple sin QR o QR Admisión general (sin mapa de asientos).";
  }
  if (idRecinto === RecintoId.AUDITORIO) {
    return "El Auditorio permite elegir entre Acceso libre, Registro simple sin QR, QR Admisión general o QR con mapa de asientos.";
  }
  return null;
}

export function ModalidadAccesoHelp({
  idRecinto,
  idModalidadAcceso,
  className = "",
}: ModalidadAccesoHelpProps) {
  const descripcion =
    idModalidadAcceso !== undefined
      ? DESCRIPCIONES_MODALIDAD[idModalidadAcceso]
      : null;
  const etiqueta =
    idModalidadAcceso !== undefined
      ? ETIQUETAS_MODALIDAD[idModalidadAcceso]
      : null;
  const notaRecinto = obtenerNotaRecinto(idRecinto);

  if (!descripcion && !notaRecinto) {
    return null;
  }

  return (
    <div
      role="note"
      className={`flex items-start gap-2.5 rounded-md border border-eventos-panel-border bg-eventos-panel-surface px-3.5 py-2.5 text-xs leading-relaxed text-eventos-body-text ${className}`}
    >
      <Info
        size={16}
        className="mt-0.5 shrink-0 text-eventos-secondary"
        aria-hidden="true"
      />
      <div className="space-y-1">
        {etiqueta && descripcion && (
          <p>
            <strong className="text-eventos-ink">{etiqueta}:</strong>{" "}
            {descripcion}
          </p>
        )}
        {notaRecinto && (!etiqueta || esLaboratorioRecinto(idRecinto)) && (
          <p className="text-eventos-muted-text">{notaRecinto}</p>
        )}
      </div>
    </div>
  );
}
