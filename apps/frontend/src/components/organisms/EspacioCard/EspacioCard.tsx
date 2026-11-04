import React from "react";
import { Button } from "../../atoms/Button/Button";
import { Landmark, Building, Monitor } from "lucide-react";

interface Espacio {
  idRecinto: number;
  nombre: string;
  tipo?: string;
  aforo: number;
  idEstadoRecinto: number;
}

interface EspacioCardProps {
  espacio: Espacio;
  onToggleEstado: (espacio: Espacio) => void;
  onGestionarEquipos: (idRecinto: number) => void;
}

export function EspacioCard({ espacio, onToggleEstado, onGestionarEquipos }: EspacioCardProps) {
  const esLaboratorio = espacio.nombre.toLowerCase().includes("laboratorio");
  const estaHabilitado = espacio.idEstadoRecinto === 1;
  const estadoTexto = estaHabilitado ? "Habilitado" : "Inhabilitado";

  return (
    <div className="bg-white rounded-md border border-gray-300 shadow-sm p-6 flex flex-col justify-between">
      <div>
        <div className="flex justify-center mb-6 text-gray-900">
          {espacio.nombre.toLowerCase().includes("auditorio") && (
            <Landmark className="w-10 h-10" />
          )}
          {espacio.nombre.toLowerCase().includes("sala") && (
            <Building className="w-10 h-10" />
          )}
          {esLaboratorio && (
            <Monitor className="w-10 h-10" />
          )}
        </div>

        <h3 className="font-bold text-xl text-gray-900 mb-4 font-merriweather">
          {espacio.nombre}
        </h3>

        <div className="text-sm text-gray-700 space-y-1 mb-6 font-merriweather">
          <p><span className="font-medium">Aforo máximo:</span> {espacio.aforo}</p>
        </div>

        <div className="flex items-center space-x-2 mb-6">
          <span
            className={`w-2.5 h-2.5 rounded-full ${estaHabilitado ? "bg-eventos-success" : "bg-eventos-error"}`}
          />
          <span className={`text-sm font-medium ${estaHabilitado ? "text-eventos-success" : "text-eventos-error"}`}>
            {estadoTexto}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        {esLaboratorio && (
          <Button text="Gestionar equipos" variant="primary" size="sm" className="w-full text-xs py-2 rounded" onClick={() => onGestionarEquipos(espacio.idRecinto)}/>
        )}
        <Button text={estaHabilitado ? "Inhabilitar" : "Habilitar"} variant="primary" size="sm" className="w-full text-xs py-2 rounded" onClick={() => onToggleEstado(espacio)}/>
      </div>
    </div>
  );
}

export default EspacioCard;