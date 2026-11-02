import { useEffect, useState } from "react";
import Button from "../../components/atoms/Button/Button";
import { Table } from "../../components/organisms/Table/Table";
import type { Columna } from "../../components/organisms/Table/Table";
import { Modal } from "../../components/molecules/Modal";
import { TextArea } from "../../components/atoms/TextArea/TextArea";
import { FormField } from "../../components/molecules/FormField";
import { useNavigate } from "react-router";


type SolicitudesAprobadas = {
  idEvento: number;
  nombre: string;
  idOrganizador: number;
  fechaInicio: string | null;
  fechaFin: string | null;
};

const MAX_MOTIVO = 500;

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

function convertirSolicitud(valor: unknown): SolicitudesAprobadas {
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

  return {
    idEvento: obtenerNumero(valor, "idEvento"),
    nombre: obtenerTexto(valor, "nombre"),
    idOrganizador: obtenerNumero(valor, "idOrganizador"),
    fechaInicio: fechas[0] ?? null,
    fechaFin: fechas[fechas.length - 1] ?? null,
  };
}

function convertirSolicitudes(valor: unknown): SolicitudesAprobadas[] {
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

export function SolicitudesAprobadas() {
  const [solicitudes, setSolicitudes] = useState<SolicitudesAprobadas[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [solicitudSeleccionada, setSolicitudSeleccionada] =
    useState<SolicitudesAprobadas | null>(null);
  const [motivo, setMotivo] = useState("");
  const [errorCancelacion, setErrorCancelacion] = useState<string | null>(null);
  const [cancelando, setCancelando] = useState(false);
  const longitudMotivo = motivo.trim().length;
  const [mostrarModalCancelacion, setMostrarModalCancelacion] = useState(false);
  const [mostrarModalConfirmacion, setModalConfirmacion] = useState(false);
  const [mostrarModalExito, setModalExito] = useState(false);
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
          "http://localhost:3000/api/solicitudes?estado=Aprobado",
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

  const cerrarModalCancelacion = () => {
    setMostrarModalCancelacion(false);
    setModalConfirmacion(false);
    setSolicitudSeleccionada(null);
    setMotivo("");
    setErrorCancelacion(null);
  };

  const abrirConfirmacionCancelacion = () => {
    if (!motivo.trim()) {
      setErrorCancelacion("El motivo de cancelación es obligatorio.");
      return;
    }

    setErrorCancelacion(null);
    setMostrarModalCancelacion(false);
    setModalConfirmacion(true);
  };

  const cerrarModalConfirmacion = () => {
    setModalConfirmacion(false);
    setMostrarModalCancelacion(true);
  };

  const confirmarCancelacion = async () => {
    if (!solicitudSeleccionada) return;

    if (!motivo.trim()) {
      setErrorCancelacion("El motivo de cancelación es obligatorio.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setErrorCancelacion("Debes iniciar sesión para cancelar el evento.");
      return;
    }

    setCancelando(true);
    setErrorCancelacion(null);

    try {
      const response = await fetch(
        `http://localhost:3000/api/solicitudes/${solicitudSeleccionada.idEvento}/cancelar`,
        {
          method: "PATCH",
          headers: {
            Authorization: `******`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ motivo: motivo.trim() }),
        },
      );

      if (!response.ok) {
        throw new Error(
          `No se pudo cancelar el evento (HTTP ${response.status}).`,
        );
      }

      const idCancelado = solicitudSeleccionada.idEvento;
      setSolicitudes((actuales) =>
        actuales.filter((solicitud) => solicitud.idEvento !== idCancelado),
      );
      cerrarModalCancelacion();
    } catch (error) {
      setErrorCancelacion(
        error instanceof Error
          ? error.message
          : "Ocurrió un error al cancelar el evento.",
      );
      setMostrarModalCancelacion(true);
    } finally {
      setCancelando(false);
    }

    <Modal
      titulo="Operación exitosa"
      contenido="Se ha cancelado exitosamente el evento"
      mostrarModal={mostrarModalExito}
      cerrarModal={() => !mostrarModalExito}>
      <Button
        text="Aceptar"
        variant="primary"
        type="button"
        onClick={() => setModalExito(false)}></Button>
    </Modal>;
  };

  const columnas: Columna<SolicitudesAprobadas>[] = [
    {
      id: "nombre",
      encabezado: "Nombre del evento",
      render: (solicitud) => solicitud.nombre,
      className: "min-w-[10rem] px-4",
    },
    {
      id: "solicitante",
      encabezado: "ID del organizador",
      render: (solicitud) => solicitud.idOrganizador,
      className: "min-w-[10rem] px-4",
    },
    {
      id: "fechaInicio",
      encabezado: "Fecha inicio",
      render: (solicitud) => mostrarFecha(solicitud.fechaInicio),
      className: "min-w-[10rem] px-4",
    },
    {
      id: "fechaFin",
      encabezado: "Fecha Fin",
      render: (solicitud) => mostrarFecha(solicitud.fechaFin),
      className: "min-w-[10rem] px-4",
    },
    {
      id: "acciones",
      encabezado: "Acciones",
      render: (solicitud) => {
        return (
          <div
            id="contenedorCeldaBotones"
            className="flex gap-2 justify-center">
            <Button text="Ver detalles" variant="primary" type="button" onClick={() => navigate(`/detalles-solicitud/${solicitud.idEvento}`) } />
            <Button
              text="Cancelar"
              variant="danger"
              type="button"
              onClick={() => {
                setMotivo("");
                setErrorCancelacion(null);
                setSolicitudSeleccionada(solicitud);
                setMostrarModalCancelacion(true);
              }}
            />
          </div>
        );
      },
    },
  ];

  return (
    <>
      <section className="space-y-5">
        <div id="contenedorSuperior">
          <div id="contenedorTitulo">
            <h1 className="font-merriweather text-[36px] font-bold">
              Solicitudes aprobadas
            </h1>
          </div>
          <div id="contenedor Filtrado"></div>
        </div>
        {cargando && <p role="status">Cargando solicitudes...</p>}
        {error && <p role="alert">{error}</p>}
        {!cargando && !error && solicitudes.length === 0 && (
          <p>No hay solicitudes aprobadas.</p>
        )}
        {!cargando && !error && solicitudes.length > 0 && (
          <div
            id="contenedorTabla"
            className="mx-auto w-full max-w-7xl overflow-x-auto">
            <Table
              columnas={columnas}
              filas={solicitudes}
              obtenerClave={(solicitud) => solicitud.idEvento}
              className="table-auto min-w-full text-center [&_tbody_tr]:h-20 [&_thead_tr]:h-[80px]"
            />
          </div>
        )}
        <Modal
          titulo="Cancelación de evento"
          contenido={`Evento: ${solicitudSeleccionada?.nombre ?? ""}.`}
          mostrarModal={mostrarModalCancelacion}
          cerrarModal={cerrarModalCancelacion}>
          <div id="conetenedorMotivo" className="flex flex-col gap-5">
            <FormField
              htmlFor="campoMotivo"
              errorMessage={
                longitudMotivo >= 500
                  ? "El motivo no debe ser mayor a 500 caracteres"
                  : longitudMotivo < 10
                    ? "El motivo de cancelación es muy corto"
                    : ""
              }>
              <TextArea
                id="campoMotivo"
                placeholder="Ingresa el motivo de cancelación"
                className="resize-none h-40"
                value={motivo}
                hasError={longitudMotivo >= 500}
                onChange={(event) => {
                  setMotivo(event.target.value);
                  setErrorCancelacion(null);
                }}
                maxLength={MAX_MOTIVO}
              />
            </FormField>
          </div>
          <div id="contenedorBotones" className="flex gap-2 justify-end">
            <Button
              text="Volver"
              variant="primary"
              disabled={cancelando}
              onClick={cerrarModalCancelacion}
            />
            <Button
              text="Cancelar evento"
              variant="danger"
              onClick={abrirConfirmacionCancelacion}
              disabled={longitudMotivo < 10}
            />
          </div>
        </Modal>
        {mostrarModalConfirmacion && (
          <Modal
            titulo="Confirmacion"
            contenido="¿Desea cancelar el evento?"
            mostrarModal={mostrarModalConfirmacion}
            cerrarModal={cerrarModalConfirmacion}>
            <div
              id="contendorBotonesConfirmacion"
              className="flex gap-2 justify-end">
              <Button
                text="Cancelar"
                variant="danger"
                disabled={cancelando}
                onClick={cerrarModalConfirmacion}
              />
              <Button
                text="Aceptar"
                variant="success"
                loading={cancelando}
                loadingText="Cancelando..."
                onClick={() => {
                  setModalConfirmacion(false);
                  void confirmarCancelacion();
                }}
              />
            </div>
          </Modal>
        )}
      </section>
    </>
  );
}
