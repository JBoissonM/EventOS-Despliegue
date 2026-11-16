import { useEffect, useMemo, useState } from "react";
import { Table, type Columna } from "../Table/Table";
import { API_BASE_URL } from "../../../lib/apiClient";
import { obtenerAhoraCdmx } from "../../../utils/fechaHorario";
import { SearchField } from "../../molecules/SearchField";
import { FilterDropdown } from "../../molecules/FilterDropdown";
import { Calendar } from "lucide-react";

export type AgendaTabla = {
  id: number;
  nombreEvento: string;
  nombreActividad: string;
  espacio: string;
  horaInicio: string;
  horaFin: string;
};

const columnas: Columna<AgendaTabla>[] = [
  {
    id: "nombreEvento",
    encabezado: "Nombre del evento",
    render: (fila) => fila.nombreEvento,
    className: "min-w-[12rem] max-w-[18rem] px-4 text-left",
  },
  {
    id: "nombreActividad",
    encabezado: "Actividad",
    render: (fila) => fila.nombreActividad,
    className: "min-w-[12rem] max-w-[16rem] px-4 text-left",
  },
  {
    id: "espacio",
    encabezado: "Espacio",
    render: (fila) => fila.espacio,
    className: "min-w-[12rem] px-4",
  },
  {
    id: "horaInicio",
    encabezado: "Hora inicio",
    render: (fila) => fila.horaInicio,
    className: "min-w-[8rem] px-4",
  },
  {
    id: "horaFin",
    encabezado: "Hora fin",
    render: (fila) => fila.horaFin,
    className: "min-w-[8rem] px-4",
  },
];

function normalizarTexto(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-MX");
}

export function AgendaDiaria() {
  const [actividades, setActividades] = useState<AgendaTabla[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtroRecinto, setFiltroRecinto] = useState("");

  const busquedaNormalizada = normalizarTexto(busqueda.trim());

  useEffect(() => {
    const controller = new AbortController();

    const cargarAgenda = async () => {
      setCargando(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        setError("Debes iniciar sesión para consultar la agenda.");
        setCargando(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/solicitudes?estado=Aprobado`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw new Error(
            `No se pudo cargar la agenda (HTTP ${response.status}).`,
          );
        }

        const data = await response.json();
        const fechaHoy = obtenerAhoraCdmx().fechaHoy;

        const lista: AgendaTabla[] = [];

        if (Array.isArray(data)) {
          for (const evento of data) {
            const nombreEvento =
              typeof evento.nombre === "string" ? evento.nombre : "Sin nombre";

            const subEventos = Array.isArray(evento.subEventos)
              ? evento.subEventos
              : [];

            for (const sub of subEventos) {
              if (sub.estado === "Cancelado") continue;

              const fechaStr =
                typeof sub.fecha?.fecha === "string"
                  ? sub.fecha.fecha.slice(0, 10)
                  : "";

              if (fechaStr === fechaHoy) {
                lista.push({
                  id: Number(sub.idSubEvento) || Math.random(),
                  nombreEvento,
                  nombreActividad:
                    typeof sub.nombre === "string"
                      ? sub.nombre
                      : "Actividad sin nombre",
                  espacio:
                    typeof sub.recinto?.nombre === "string"
                      ? sub.recinto.nombre
                      : "Sin espacio asignado",
                  horaInicio:
                    typeof sub.fecha?.horaInicio === "string"
                      ? sub.fecha.horaInicio.slice(0, 5)
                      : "--:--",
                  horaFin:
                    typeof sub.fecha?.horaFin === "string"
                      ? sub.fecha.horaFin.slice(0, 5)
                      : "--:--",
                });
              }
            }
          }
        }

        lista.sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
        setActividades(lista);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(
          err instanceof Error
            ? err.message
            : "Ocurrió un error al cargar la agenda.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setCargando(false);
        }
      }
    };

    void cargarAgenda();
    return () => controller.abort();
  }, []);

  const recintos = useMemo(
    () =>
      [
        ...new Set(
          actividades
            .map((act) => act.espacio)
            .filter(
              (espacio): espacio is string =>
                Boolean(espacio) && espacio !== "Sin espacio asignado",
            ),
        ),
      ].sort((a, b) => a.localeCompare(b, "es")),
    [actividades],
  );

  const actividadesFiltradas = useMemo(() => {
    return actividades.filter((actividad) => {
      if (busquedaNormalizada) {
        const coincideBusqueda = [
          actividad.nombreEvento,
          actividad.nombreActividad,
        ].some((texto) => normalizarTexto(texto).includes(busquedaNormalizada));
        if (!coincideBusqueda) return false;
      }

      if (filtroRecinto) {
        if (
          normalizarTexto(actividad.espacio) !== normalizarTexto(filtroRecinto)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [actividades, busquedaNormalizada, filtroRecinto]);

  return (
    <div className="w-full min-w-0 space-y-3 xl:max-w-7xl">
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-end">
        <div className="w-full sm:max-w-md">
          <SearchField
            value={busqueda}
            onChange={setBusqueda}
            placeholder="Buscar por evento o actividad"
          />
        </div>
        <div className="flex items-center gap-2">
          <FilterDropdown
            label="Espacio"
            allLabel="Todos los espacios"
            value={filtroRecinto}
            options={recintos.map((name) => ({
              value: name,
              label: name,
            }))}
            onChange={setFiltroRecinto}
          />
        </div>
      </div>

      <div
        id="contenedorSeccionTabla"
        className="mx-auto w-full max-w-7xl overflow-x-auto overflow-y-auto max-h-[325px] bg-white shadow-md border border-gray-200 rounded-md"
      >
        {cargando ? (
          <div className="py-12 text-center text-gray-500">
            Cargando actividades del día...
          </div>
        ) : error ? (
          <div className="py-12 text-center text-red-500">{error}</div>
        ) : actividades.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            No hay actividades programadas para el día de hoy.
          </div>
        ) : actividadesFiltradas.length === 0 ? (
          <div className="grid grid-cols-1 gap-3 py-12 place-items-center text-gray-500">
            <Calendar size={30} />
            <p> No se encontraron coincidencias</p>
          </div>
        ) : (
          <Table
            columnas={columnas}
            filas={actividadesFiltradas}
            obtenerClave={(item) => item.id}
            className="table-auto min-w-full text-center [&_tbody_tr]:h-20 [&_thead_tr]:h-[80px] [&_th]:sticky [&_th]:top-0 [&_th]:bg-white [&_th]:z-10"
          />
        )}
      </div>
    </div>
  );
}
