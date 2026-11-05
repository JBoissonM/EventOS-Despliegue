import { useEffect, useState } from "react";
import { useParams } from "react-router";
import {
  AlcanceEvento,
  EstadoEvento,
  EstadoSubEvento,
  type EventoOrganizadorDetalle,
  type EventoOrganizadorDetalleSubevento,
  type PersonalLogisticaItem,
  type Ponente,
} from "@eventos/shared";
import Button from "../../components/atoms/Button/Button";
import { Table } from "../../components/organisms/Table/Table";
import type { Columna } from "../../components/organisms/Table/Table";
import { EventBanner } from "../event-details/components/molecules/EventBanner";
import { SpaceRequerimentsDialog } from "../../components/organisms/SpaceRequirementsDialog/SpaceRequerimentsDialog";

type TablaPonente = {
  id: number;
  nombre: string;
  correo: string;
};

type TablaPersonalLogistica = PersonalLogisticaItem;

const columnasPonente: Columna<TablaPonente>[] = [
  {
    id: "nombreCompleto",
    encabezado: "Nombre completo",
    render: (ponente) => ponente.nombre,
    className: "min-w-[6rem] max-w-[8rem] px-3",
  },
  {
    id: "correo",
    encabezado: "Correo",
    render: (ponente) => ponente.correo,
    className: "min-w-[10rem] max-w-[14rem] break-all px-3",
  },
];

const columnasLogistica: Columna<TablaPersonalLogistica>[] = [
  {
    id: "nombreCompleto",
    encabezado: "Nombre completo",
    render: (personal) => personal.nombreCompleto,
    className: "min-w-[10rem] px-3",
  },
  {
    id: "correo",
    encabezado: "Correo",
    render: (personal) => personal.correo,
    className: "min-w-[12rem] break-all px-3",
  },
];

function esRegistro(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null;
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

function obtenerTextoNullable(
  registro: Record<string, unknown>,
  campo: string,
): string | null {
  const valor = registro[campo];
  if (valor === null || typeof valor === "string") {
    return valor;
  }
  throw new Error(`La respuesta no contiene un texto válido para "${campo}".`);
}

function obtenerNumero(
  registro: Record<string, unknown>,
  campo: string,
): number {
  const valor = registro[campo];
  if (typeof valor !== "number" || !Number.isFinite(valor)) {
    throw new Error(
      `La respuesta no contiene un número válido para "${campo}".`,
    );
  }
  return valor;
}

function obtenerBooleano(
  registro: Record<string, unknown>,
  campo: string,
): boolean {
  const valor = registro[campo];
  if (typeof valor !== "boolean") {
    throw new Error(
      `La respuesta no contiene un valor válido para "${campo}".`,
    );
  }
  return valor;
}

function convertirAlcance(valor: unknown): AlcanceEvento {
  switch (valor) {
    case AlcanceEvento.PUBLICO:
      return AlcanceEvento.PUBLICO;
    case AlcanceEvento.INTERNO:
      return AlcanceEvento.INTERNO;
    case AlcanceEvento.PRIVADO:
      return AlcanceEvento.PRIVADO;
    default:
      throw new Error("La respuesta contiene un alcance de evento inválido.");
  }
}

function convertirEstadoEvento(valor: unknown): EstadoEvento {
  switch (valor) {
    case EstadoEvento.RECHAZADO:
      return EstadoEvento.RECHAZADO;
    case EstadoEvento.ACEPTADO:
      return EstadoEvento.ACEPTADO;
    case EstadoEvento.ENPROCESO:
      return EstadoEvento.ENPROCESO;
    case EstadoEvento.CANCELADO:
      return EstadoEvento.CANCELADO;
    case EstadoEvento.FINALIZADO:
      return EstadoEvento.FINALIZADO;
    default:
      throw new Error("La respuesta contiene un estado de evento inválido.");
  }
}

function convertirEstadoSubevento(valor: unknown): EstadoSubEvento {
  const estado = Object.values(EstadoSubEvento).find((item) => item === valor);
  if (!estado) {
    throw new Error("La respuesta contiene un estado de subevento inválido.");
  }
  return estado;
}

function convertirFecha(
  valor: unknown,
): EventoOrganizadorDetalleSubevento["fecha"] {
  if (valor === null) return null;
  if (!esRegistro(valor)) {
    throw new Error("La respuesta contiene una fecha de subevento inválida.");
  }

  return {
    idFecha: obtenerNumero(valor, "idFecha"),
    fecha: obtenerTexto(valor, "fecha"),
    horaInicio: obtenerTexto(valor, "horaInicio"),
    horaFin: obtenerTexto(valor, "horaFin"),
  };
}

function convertirRecinto(
  valor: unknown,
): EventoOrganizadorDetalleSubevento["recinto"] {
  if (valor === null) return null;
  if (!esRegistro(valor)) {
    throw new Error("La respuesta contiene un recinto inválido.");
  }

  return {
    idRecinto: obtenerNumero(valor, "idRecinto"),
    nombre: obtenerTexto(valor, "nombre"),
    aforo: obtenerNumero(valor, "aforo"),
  };
}

function convertirPonente(valor: unknown): Ponente {
  if (!esRegistro(valor)) {
    throw new Error("La respuesta contiene un ponente inválido.");
  }

  return {
    idPonente: obtenerNumero(valor, "idPonente"),
    nombre: obtenerTexto(valor, "nombre"),
    apellidoPa: obtenerTexto(valor, "apellidoPa"),
    apellidoMa: obtenerTextoNullable(valor, "apellidoMa"),
    correo: obtenerTexto(valor, "correo"),
    idSubEvento: obtenerNumero(valor, "idSubEvento"),
  };
}

function convertirPersonalLogistica(valor: unknown): PersonalLogisticaItem {
  if (!esRegistro(valor)) {
    throw new Error("La respuesta contiene personal de logística inválido.");
  }

  return {
    idUsuario: obtenerNumero(valor, "idUsuario"),
    nombreCompleto: obtenerTexto(valor, "nombreCompleto"),
    correo: obtenerTexto(valor, "correo"),
    tipoCuenta: obtenerTexto(valor, "tipoCuenta"),
  };
}

function convertirSubevento(valor: unknown): EventoOrganizadorDetalleSubevento {
  if (!esRegistro(valor) || !Array.isArray(valor.ponentes)) {
    throw new Error("La respuesta contiene un subevento inválido.");
  }

  return {
    idSubEvento: obtenerNumero(valor, "idSubEvento"),
    nombre: obtenerTexto(valor, "nombre"),
    descripcion: obtenerTexto(valor, "descripcion"),
    accesoQR: obtenerBooleano(valor, "accesoQR"),
    estado: convertirEstadoSubevento(valor.estado),
    fecha: convertirFecha(valor.fecha),
    recinto: convertirRecinto(valor.recinto),
    ponentes: valor.ponentes.map(convertirPonente),
    boletosEmitidos: obtenerNumero(valor, "boletosEmitidos"),
  };
}

function convertirEvento(valor: unknown): EventoOrganizadorDetalle {
  if (
    !esRegistro(valor) ||
    !Array.isArray(valor.subEventos) ||
    !Array.isArray(valor.personalLogistica)
  ) {
    throw new Error("La respuesta del evento tiene un formato inválido.");
  }

  const idAlcance =
    valor.idAlcance === undefined
      ? undefined
      : convertirAlcance(valor.idAlcance);
  const idEstadoEvento =
    valor.idEstadoEvento === undefined
      ? undefined
      : convertirEstadoEvento(valor.idEstadoEvento);

  return {
    idEvento: obtenerNumero(valor, "idEvento"),
    nombre: obtenerTexto(valor, "nombre"),
    descripcion: obtenerTexto(valor, "descripcion"),
    justificacion: obtenerTextoNullable(valor, "justificacion"),
    poster: obtenerTexto(valor, "poster"),
    posterUrl: obtenerTextoNullable(valor, "posterUrl"),
    ...(idAlcance !== undefined ? { idAlcance } : {}),
    ...(idEstadoEvento !== undefined ? { idEstadoEvento } : {}),
    esUrgente: obtenerBooleano(valor, "esUrgente"),
    motivoUrgencia: obtenerTextoNullable(valor, "motivoUrgencia"),
    idOrganizador: obtenerNumero(valor, "idOrganizador"),
    cupoMaximo: obtenerNumero(valor, "cupoMaximo"),
    boletosActivosCount: obtenerNumero(valor, "boletosActivosCount"),
    subEventos: valor.subEventos.map(convertirSubevento),
    personalLogistica: valor.personalLogistica.map(convertirPersonalLogistica),
    logisticaCount: obtenerNumero(valor, "logisticaCount"),
  };
}

function obtenerTextoAlcance(alcance?: AlcanceEvento): string {
  switch (alcance) {
    case AlcanceEvento.PUBLICO:
      return "Público";
    case AlcanceEvento.INTERNO:
      return "Interno";
    case AlcanceEvento.PRIVADO:
      return "Privado";
    default:
      return "No especificado";
  }
}

function formatearFecha(fecha: string | null | undefined): string {
  if (!fecha) return "No especificada";
  const coincidencia = /^(\d{4})-(\d{2})-(\d{2})/.exec(fecha);
  return coincidencia
    ? `${coincidencia[3]}/${coincidencia[2]}/${coincidencia[1]}`
    : fecha;
}

function formatearHora(hora: string | null | undefined): string {
  return hora ? hora.slice(0, 5) : "No especificada";
}

export function AdministracionEvento() {
  const { idEvento } = useParams();
  const [datosEvento, setDatosEvento] =
    useState<EventoOrganizadorDetalle | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const subevento =
    datosEvento?.subEventos.length === 1 ? datosEvento.subEventos[0] : null;
  const personalLogistica =
    subevento && datosEvento ? datosEvento.personalLogistica ?? [] : [];

  useEffect(() => {
    const controller = new AbortController();

    const cargarEvento = async () => {
      setCargando(true);
      setError(null);
      setDatosEvento(null);

      if (!idEvento || !/^\d+$/.test(idEvento) || Number(idEvento) < 1) {
        setError("El ID del evento no es válido.");
        setCargando(false);
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        setError("Sesión no iniciada.");
        setCargando(false);
        return;
      }

      try {
        const response = await fetch(
          `http://localhost:3000/api/eventos/${idEvento}/detalle-organizador`,
          {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw new Error(
            `No se pudieron cargar los detalles del evento (HTTP ${response.status}).`,
          );
        }

        const respuesta: unknown = await response.json();
        setDatosEvento(convertirEvento(respuesta));
      } catch (error) {
        if (controller.signal.aborted) return;
        setError(
          error instanceof Error
            ? error.message
            : "Ocurrió un error al cargar el evento.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setCargando(false);
        }
      }
    };

    void cargarEvento();
    return () => controller.abort();
  }, [idEvento]);

  const ponentes: TablaPonente[] =
    datosEvento?.subEventos.flatMap((subevento) =>
      subevento.ponentes.map((ponente) => ({
        id: ponente.idPonente,
        nombre: [ponente.nombre, ponente.apellidoPa, ponente.apellidoMa]
          .filter(Boolean)
          .join(" "),
        correo: ponente.correo,
      })),
    ) ?? [];

  return (
    <section className="mx-auto w-full max-w-7xl space-y-8 px-4 sm:px-6 lg:space-y-10 lg:px-8">
      <div id="contenedorTituloBanner" className="space-y-4 sm:space-y-5">
        <h1 className="font-merriweather text-2xl font-semibold leading-tight sm:text-3xl lg:text-4xl">
          Administración y detalles de mi evento
        </h1>
        {datosEvento && (
          <EventBanner
            eventName={datosEvento.nombre}
            posterUrl={datosEvento.posterUrl}
          />
        )}
      </div>

      {cargando && (
        <p
          role="status"
          className="rounded-lg bg-gray-50 px-4 py-6 text-gray-600">
          Cargando detalles del evento...
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-6 text-red-700">
          {error}
        </p>
      )}

      {datosEvento && (
        <>
          <div
            id="contenedorDatos"
            className="grid min-w-0 grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] xl:gap-12">
            <div id="contenedorIzquierda" className="w-full min-w-0 space-y-6">
              <div id="contenedorTitulo" className="space-y-2">
                <span className="block font-merriweather text-xl font-bold text-secondary sm:text-2xl">
                  {datosEvento.nombre}
                </span>
                <p className="break-words">{datosEvento.descripcion}</p>
              </div>

              <div id="contenedorPonentes">
                <h2 className="text-xl font-bold sm:text-2xl">Ponentes</h2>
                {ponentes.length > 0 ? (
                  <div className="mt-4 w-full min-w-0 overflow-x-auto rounded-md border border-gray-200 shadow-md">
                    <Table
                      columnas={columnasPonente}
                      filas={ponentes}
                      obtenerClave={(ponente) => ponente.id}
                      className="table-auto min-w-full bg-white text-left text-sm [&_tbody_tr]:h-12 [&_thead_tr]:h-10 [&_th]:py-2 [&_td]:py-2"
                    />
                  </div>
                ) : (
                  <p className="mt-3 text-gray-600">
                    No hay ponentes registrados para este evento.
                  </p>
                )}
              </div>

              {subevento && (
                <div id="contenedorLogistica">
                  <h2 className="text-xl font-bold sm:text-2xl">
                    Personal de lógistica
                  </h2>
                  {personalLogistica.length > 0 ? (
                    <div className="mt-4 w-full min-w-0 overflow-x-auto rounded-md border border-gray-200 shadow-md">
                      <Table
                        columnas={columnasLogistica}
                        filas={personalLogistica}
                        obtenerClave={(personal) => personal.idUsuario}
                        className="table-auto min-w-full bg-white text-left text-sm [&_tbody_tr]:h-12 [&_thead_tr]:h-10 [&_th]:py-2 [&_td]:py-2"
                      />
                    </div>
                  ) : (
                    <p className="mt-3 text-gray-600">
                      No hay personal de lógistica registrado para este evento.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div id="contenedorSubeventos" className="w-full min-w-0 space-y-4">
              {datosEvento.subEventos.map((subevento) => (
                <article
                  key={subevento.idSubEvento}
                  className="grid min-w-0 grid-cols-1 gap-x-6 gap-y-5 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:grid-cols-2 sm:p-6">
                  <div className="col-span-1 flex min-w-0 flex-col gap-2 sm:col-span-2">
                    <h2 className="text-lg font-bold">{subevento.nombre}</h2>
                    <p className="break-words text-gray-700">
                      {subevento.descripcion}
                    </p>
                  </div>
                  <div className="flex min-w-0 flex-col gap-2">
                    <span className="font-bold">Espacio</span>
                    <span>
                      {subevento.recinto?.nombre ?? "No especificado"}
                    </span>
                  </div>
                  <div className="flex min-w-0 flex-col gap-2">
                    <span className="font-bold">Fecha</span>
                    <span>{formatearFecha(subevento.fecha?.fecha)}</span>
                  </div>
                  <div className="flex min-w-0 flex-col gap-2">
                    <span className="font-bold">Hora de inicio</span>
                    <span>{formatearHora(subevento.fecha?.horaInicio)}</span>
                  </div>
                  <div className="flex min-w-0 flex-col gap-2">
                    <span className="font-bold">Hora de finalizacion</span>
                    <span>{formatearHora(subevento.fecha?.horaFin)}</span>
                  </div>
                  <div className="flex min-w-0 flex-col gap-2">
                    <span className="font-bold">Modalidad de cupo</span>
                    <span>
                      {subevento.accesoQR ? "Acceso con boleto" : "Acceso"}
                    </span>
                  </div>
                  <div className="flex min-w-0 flex-col gap-2">
                    <span className="font-bold">Alcance</span>
                    <span>{obtenerTextoAlcance(datosEvento.idAlcance)}</span>
                  </div>
                  <div className="flex min-w-0 flex-col gap-2">
                    <span className="font-bold">Aforo estimado</span>
                    <span>
                      {subevento.recinto?.aforo ?? datosEvento.cupoMaximo}
                    </span>
                  </div>
                  <div className="flex min-w-0 flex-col gap-2">
                    <span className="font-bold">Boletos emitidos</span>
                    <span>{subevento.boletosEmitidos}</span>
                  </div>
                  <div className="flex min-w-0 flex-col gap-2">
                    <span className="font-bold">Estado</span>
                    <span>{subevento.estado}</span>
                  </div>

                  <div className="flex min-w-0 flex-col gap-2 sm:col-span-2">
                    <span className="font-bold">Beneficio politécnico</span>
                    <p className="mt-2 break-words">
                      {datosEvento.justificacion || "No especificado"}
                    </p>
                  </div>
                </article>
              )
              )}

            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
            {subevento?.recinto && (
              <Button
                text="Ver detalles de laboratorio"
                variant="primary"
                type="button"
                disabled={subevento.recinto.nombre === "Auditorio Principal" || subevento.recinto.nombre === "Sala 14"}
                onClick={() => setMostrarModal(true)}
              />
            )}
            <Button text="Cancelar evento" variant="primary" type="button" />
            <Button text="Modificar evento" variant="primary" type="button" />
          </div>
          {subevento?.recinto && (
            <SpaceRequerimentsDialog
              laboratorio={subevento.recinto.nombre}
              id={subevento.recinto.idRecinto}
              mostrar={mostrarModal}
              cerrar={() => setMostrarModal(false)}
            />
          )}
        </>
      )}
    </section>
  );
}
