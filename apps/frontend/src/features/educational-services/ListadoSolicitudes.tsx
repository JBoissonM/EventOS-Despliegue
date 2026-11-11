import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { API_BASE_URL } from "../../lib/apiClient";
import { Button } from "../../components/atoms/Button/Button";
import { Table, type Columna } from "../../components/organisms/Table/Table";
import Badge from "../../components/atoms/Badge/Badge";

type SolicitudTabla = {
  idEvento: number;
  nombre: string;
  nombreSolicitante: string;
  fechaInicio: string | null;
  fechaCierre: string | null;
  urgente: boolean;
};

function esRegistro(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null;
}

function obtenerNumero(
  registro: Record<string, unknown>,
  campo: string,
): number {
  const valor = registro[campo];
  if (typeof valor !== "number") {
    throw new Error(
      `La respuesta no contiene un número válido para "${campo}".`,
    );
  }
  return valor;
}

function obtenerTexto(
  registro: Record<string, unknown>,
  campo: string,
): string {
  const valor = registro[campo];
  if (typeof valor !== "string") {
    throw new Error(
      `La respuesta no contiene un texto válido para "${campo}".`,
    );
  }
  return valor;
}

function convertirFecha(valor: unknown): string | null {
  if (valor === null) {
    return null;
  }
  if (!esRegistro(valor)) {
    throw new Error("La respuesta contiene una fecha de subevento inválida.");
  }

  const fecha = obtenerTexto(valor, "fecha");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    throw new Error("La respuesta contiene una fecha con formato inválido.");
  }
  return fecha;
}

function convertirSolicitud(valor: unknown): SolicitudTabla {
  if (!esRegistro(valor)) {
    throw new Error("La respuesta contiene una solicitud inválida.");
  }
  if (!Array.isArray(valor.subEventos)) {
    throw new Error("La respuesta no contiene una lista válida de subeventos.");
  }

  const fechas = valor.subEventos
    .map((subevento: unknown) => {
      if (!esRegistro(subevento)) {
        throw new Error("La respuesta contiene un subevento inválido.");
      }
      return convertirFecha(subevento.fecha);
    })
    .filter((fecha: string | null): fecha is string => fecha !== null)
    .sort();

  const solicitante = valor.solicitante;
  let nombreSolicitante = "No disponible";

  if (solicitante !== null && solicitante !== undefined) {
    if (!esRegistro(solicitante)) {
      throw new Error("La respuesta contiene datos de solicitante inválidos.");
    }
    nombreSolicitante = obtenerTexto(solicitante, "nombreCompleto");
  }

  const urgente = valor.esUrgente;
  if (typeof urgente !== "boolean") {
    throw new Error(
      'La respuesta no contiene un booleano válido para "esUrgente".',
    );
  }

  return {
    idEvento: obtenerNumero(valor, "idEvento"),
    nombre: obtenerTexto(valor, "nombre"),
    nombreSolicitante,
    fechaInicio: fechas[0] ?? null,
    fechaCierre: fechas[fechas.length - 1] ?? null,
    urgente,
  };
}

function convertirSolicitudes(valor: unknown): SolicitudTabla[] {
  if (!Array.isArray(valor)) {
    throw new Error(
      "La respuesta del servidor no contiene una lista de solicitudes.",
    );
  }
  return valor.map(convertirSolicitud);
}

function mostrarFecha(fecha: string | null): string {
  if (!fecha) {
    return "No disponible";
  }
  return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-MX");
}

export function ListadoSolicitudes() {
  const [solicitudes, setSolicitudes] = useState<SolicitudTabla[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const controller = new AbortController();

    const cargarSolicitudes = async () => {
      setCargando(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        setError("Debes iniciar sesión para ver las solicitudes.");
        setCargando(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/solicitudes?estado=Pendiente`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw new Error(
            `No se pudieron cargar las solicitudes (HTTP ${response.status}).`,
          );
        }

        const respuesta: unknown = await response.json();
        setSolicitudes(convertirSolicitudes(respuesta));
      } catch (error) {
        if (controller.signal.aborted) return;
        setError(
          error instanceof Error
            ? error.message
            : "Ocurrió un error al cargar las solicitudes.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setCargando(false);
        }
      }
    };

    void cargarSolicitudes();
    return () => controller.abort();
  }, []);

  const columnas: Columna<SolicitudTabla>[] = [
    {
      id: "prioridad",
      encabezado: "Prioridad",
      render: (solicitud) => (
        <Badge variant={solicitud.urgente === true ? "error" : "success"}>
          {solicitud.urgente == true && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              className="lucide lucide-square-exclamation-point preview-icon">
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <line x1="12" x2="12" y1="8" y2="12" />
              <line x1="12" x2="12.01" y1="16" y2="16" />
            </svg>
          )}
          {solicitud.urgente === true ? "Urgente" : "Normal"}
        </Badge>
      ),
    },

    {
      id: "nombre",
      encabezado: "Nombre del evento",
      render: (solicitud) => solicitud.nombre,
      className: "min-w-[12rem] max-w-[18rem] px-4",
    },
    {
      id: "solicitante",
      encabezado: "Nombre del solicitante",
      render: (solicitud) => solicitud.nombreSolicitante,
      className: "min-w-[12rem] max-w-[10rem] px-4",
    },
    {
      id: "fechaInicio",
      encabezado: "Fecha inicio",
      render: (solicitud) => mostrarFecha(solicitud.fechaInicio),
      className: "min-w-[8rem] px-4",
    },
    {
      id: "fechaCierre",
      encabezado: "Fecha fin",
      render: (solicitud) => mostrarFecha(solicitud.fechaCierre),
      className: "min-w-[8rem] px-4",
    },
    {
      id: "acciones",
      encabezado: "Acciones",
      render: (solicitud) => (
        <Button
          text="Ver detalles"
          type="button"
          onClick={() =>
            navigate(`/detalles-solicitud/${solicitud.idEvento}`, {
              state: { from: "pendientes" },
            })
          }
        />
      ),
    },
  ];

  return (
    <section className="space-y-5">
      <div id="titulos">
        <h1 className="font-merriweather text-[36px] font-bold">
          Solicitudes pendientes
        </h1>
      </div>
      {cargando && <p role="status">Cargando solicitudes...</p>}
      {error && <p role="alert">{error}</p>}
      {!cargando && !error && solicitudes.length === 0 && (
        <div
          id="contenederIcono"
          className="flex min-h-[50vh] flex-col items-center justify-center text-center space-y-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="60"
            height="60"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            className="lucide lucide-calendar preview-icon">
            <path d="M8 2v3" />
            <path d="M16 2v3" />
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18" />
          </svg>
          <p className="merriweather text-[24px] font-semibold">
            Sin solicitudes pendientes.
          </p>
          <p></p>
        </div>
      )}
      {!cargando && !error && solicitudes.length > 0 && (
        <div
          id="contenedorTabla"
          className="mx-auto w-full max-w-7xl overflow-x-auto shadow-md p-5 border border-gray-200 bg-white">
          <Table
            columnas={columnas}
            filas={solicitudes}
            obtenerClave={(solicitud) => solicitud.idEvento}
            className="table-auto min-w-full text-left [&_tbody_tr]:h-20 [&_thead_tr]:h-[80px]"
          />
        </div>
      )}
    </section>
  );
}
