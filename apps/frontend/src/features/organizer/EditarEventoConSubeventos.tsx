import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams } from "react-router";
import {
  AlcanceEvento,
  EstadoSubEvento,
  RecintoId,
  type ActualizarInfoGeneralPayload,
  type EventoOrganizadorDetalle,
  type ModificarLogisticaPayload,
  type PersonalLogisticaItem,
  type Recinto,
  type SubEventoLogisticaPayload,
} from "@eventos/shared";
import { ArrowLeft, Pencil } from "lucide-react";
import { EventBanner } from "../event-details/components/molecules/EventBanner";
import { Input } from "../../components/atoms/Input/Input";
import { InputFile } from "../../components/atoms/InputFile/InputFile";
import { Select } from "../../components/atoms/Select/Select";
import { TextArea } from "../../components/atoms/TextArea/TextArea";
import Button from "../../components/atoms/Button/Button";
import { FormField } from "../../components/molecules/FormField";
import { Modal } from "../../components/molecules/Modal";
import { apiRequest } from "../../lib/apiClient";
import { ModalSubevento } from "../../components/organisms/ModalSubevento/ModalSubevento";
import { SpaceRequerimentsDialog } from "../../components/organisms/SpaceRequirementsDialog/SpaceRequerimentsDialog";
import {
  OrganizerSubeventCard,
  type OrganizerSubeventCardData,
} from "./components/OrganizerSubeventCard";
import { Table, type Columna } from "../../components/organisms/Table/Table";
import Badge from "../../components/atoms/Badge/Badge";

interface ActividadEditable {
  llave: string;
  idSubEvento?: number;
  nombre: string;
  descripcion: string;
  idRecinto: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  accesoQR: boolean;
}

interface DatosGenerales {
  nombre: string;
  descripcion: string;
  justificacion: string;
  idAlcance: AlcanceEvento | "";
}

const ACCESOS = [
  { value: "true", label: "Acceso con QR" },
  { value: "false", label: "Entrada libre" },
];

const ALCANCES = [
  { value: String(AlcanceEvento.PUBLICO), label: "Público" },
  { value: String(AlcanceEvento.INTERNO), label: "Interno" },
  { value: String(AlcanceEvento.PRIVADO), label: "Privado" },
];

const HORAS_INICIO = [
  "07:00",
  "07:30",
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
  "21:00",
].map((h) => ({ value: h, label: h }));

const HORAS_FIN = [
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
  "21:00",
  "21:30",
  "22:00",
].map((h) => ({ value: h, label: h }));

const columnasLogistica: Columna<PersonalLogisticaItem>[] = [
  {
    id: "correo",
    encabezado: "Correo",
    render: (personal) => personal.correo,
    className: "min-w-[12rem] break-all px-3",
  },
  {
    id: "acciones",
    encabezado: "Acción",
    render: () => {
      return <Button text="Eliminar" variant="primary" type="button" />;
    },
    className: "min-w-[8rem] max-w-[8rem] break-all px-3",
  },
];

function diferenciaEntreFechas(fechaInicio: string, fechaFin: string): number {
  const [y1, m1, d1] = fechaInicio.split("-").map(Number);
  const [y2, m2, d2] = fechaFin.split("-").map(Number);
  const utc1 = Date.UTC(y1, m1 - 1, d1);
  const utc2 = Date.UTC(y2, m2 - 1, d2);
  return Math.round((utc2 - utc1) / (1000 * 60 * 60 * 24));
}

function sumarDias(fecha: string, dias: number): string {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  const d = new Date(Date.UTC(anio, mes - 1, dia));
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

function obtenerMensajeError(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Ocurrió un error inesperado.";
}

function obtenerDatosGenerales(
  evento: EventoOrganizadorDetalle,
): DatosGenerales {
  return {
    nombre: evento.nombre,
    descripcion: evento.descripcion,
    justificacion: evento.justificacion ?? "",
    idAlcance: evento.idAlcance ?? "",
  };
}

function mapearPropuesta(
  actividad: SubEventoLogisticaPayload,
  actual?: EventoOrganizadorDetalle["subEventos"][number],
): ActividadEditable {
  const llave = actividad.idSubEvento
    ? `subevento-${actividad.idSubEvento}`
    : `nuevo-${crypto.randomUUID()}`;
  return {
    llave,
    ...(actividad.idSubEvento !== undefined
      ? { idSubEvento: actividad.idSubEvento }
      : {}),
    nombre: actividad.nombre,
    descripcion: actividad.descripcion,
    idRecinto: String(actividad.idRecinto),
    fecha: actividad.fecha.slice(0, 10),
    horaInicio: actividad.horaInicio.slice(0, 5),
    horaFin: actividad.horaFin.slice(0, 5),
    accesoQR: actividad.accesoQR ?? actual?.accesoQR ?? false,
  };
}

function obtenerActividades(
  evento: EventoOrganizadorDetalle,
): ActividadEditable[] {
  const propuesta = evento.solicitudModificacionPendiente?.subeventosPropuestos;
  if (propuesta) {
    return propuesta.map((item) =>
      mapearPropuesta(
        item,
        evento.subEventos.find(
          (subevento) => subevento.idSubEvento === item.idSubEvento,
        ),
      ),
    );
  }

  return evento.subEventos
    .filter((subevento) => subevento.estado !== EstadoSubEvento.CANCELADO)
    .map((subevento) => ({
      llave: `subevento-${subevento.idSubEvento}`,
      idSubEvento: subevento.idSubEvento,
      nombre: subevento.nombre,
      descripcion: subevento.descripcion,
      idRecinto: subevento.recinto ? String(subevento.recinto.idRecinto) : "",
      fecha: subevento.fecha?.fecha.slice(0, 10) ?? "",
      horaInicio: subevento.fecha?.horaInicio.slice(0, 5) ?? "",
      horaFin: subevento.fecha?.horaFin.slice(0, 5) ?? "",
      accesoQR: subevento.accesoQR,
    }));
}

function obtenerPayloadActividades(
  actividades: ActividadEditable[],
): SubEventoLogisticaPayload[] {
  return actividades.map((actividad) => ({
    ...(actividad.idSubEvento !== undefined
      ? { idSubEvento: actividad.idSubEvento }
      : {}),
    nombre: actividad.nombre.trim(),
    descripcion: actividad.descripcion.trim(),
    idRecinto: Number(actividad.idRecinto),
    accesoQR: actividad.accesoQR,
    fecha: actividad.fecha,
    horaInicio: actividad.horaInicio,
    horaFin: actividad.horaFin,
  }));
}

export function EditarEventoConSubeventos() {
  const { idEvento } = useParams();
  const navigate = useNavigate();
  const [evento, setEvento] = useState<EventoOrganizadorDetalle | null>(null);
  const [datosGenerales, setDatosGenerales] = useState<DatosGenerales | null>(
    null,
  );
  const [datosGeneralesIniciales, setDatosGeneralesIniciales] =
    useState<DatosGenerales | null>(null);
  const [actividades, setActividades] = useState<ActividadEditable[]>([]);
  const [actividadesIniciales, setActividadesIniciales] = useState<
    ActividadEditable[]
  >([]);
  const [recintos, setRecintos] = useState<Recinto[]>([]);
  const [archivoPoster, setArchivoPoster] = useState<File | null>(null);
  const [motivo, setMotivo] = useState("");
  const [mostrarModalMotivo, setMostrarModalMotivo] = useState(false);
  const confirmoEnvioLogistica = useRef(false);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [modalSubeventoAbierto, setModalSubeventoAbierto] = useState<
    string | null
  >(null);
  const [modalEspacio, setModalEspacio] = useState<{
    id: number;
    nombre: string;
  } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const cargar = async () => {
      setCargando(true);
      setError(null);
      try {
        if (!idEvento || !/^\d+$/.test(idEvento) || Number(idEvento) < 1) {
          throw new Error("El ID del evento no es válido.");
        }
        if (!localStorage.getItem("token")) {
          throw new Error("Sesión no iniciada.");
        }
        const [detalle, listaRecintos] = await Promise.all([
          apiRequest<EventoOrganizadorDetalle>(
            `eventos/${idEvento}/detalle-organizador`,
            { signal: controller.signal },
          ),
          apiRequest<Recinto[]>("espacios/disponibles", {
            signal: controller.signal,
          }),
        ]);
        if (controller.signal.aborted) return;

        const generales = obtenerDatosGenerales(detalle);
        const listaActividades = obtenerActividades(detalle);
        setEvento(detalle);
        setDatosGenerales(generales);
        setDatosGeneralesIniciales(generales);
        setActividades(listaActividades);
        setActividadesIniciales(listaActividades);
        setRecintos(listaRecintos);
        setMotivo(
          detalle.solicitudModificacionPendiente?.motivoModificacion ?? "",
        );
      } catch (errorCarga) {
        if (!controller.signal.aborted) {
          setError(obtenerMensajeError(errorCarga));
        }
      } finally {
        if (!controller.signal.aborted) setCargando(false);
      }
    };

    void cargar();
    return () => controller.abort();
  }, [idEvento]);

  const cambiosGenerales = Boolean(
    datosGenerales &&
      datosGeneralesIniciales &&
      (datosGenerales.nombre !== datosGeneralesIniciales.nombre ||
        datosGenerales.descripcion !== datosGeneralesIniciales.descripcion ||
        datosGenerales.justificacion !==
          datosGeneralesIniciales.justificacion ||
        datosGenerales.idAlcance !== datosGeneralesIniciales.idAlcance ||
        archivoPoster),
  );
  const payloadActividades = obtenerPayloadActividades(actividades);
  const actividadesInicialesPayload =
    obtenerPayloadActividades(actividadesIniciales);
  const cambiosActividades =
    JSON.stringify(payloadActividades) !==
    JSON.stringify(actividadesInicialesPayload);

  function agregarActividad() {
    const primeraActividad = actividades[0];
    setActividades((actuales) => [
      ...actuales,
      {
        llave: `nuevo-${crypto.randomUUID()}`,
        nombre: "",
        descripcion: "",
        idRecinto: "",
        fecha: primeraActividad?.fecha ?? "",
        horaInicio: "",
        horaFin: "",
        accesoQR: false,
      },
    ]);
  }

  function quitarActividad(llave: string) {
    setActividades((actuales) =>
      actuales.filter((item) => item.llave !== llave),
    );
  }

  function actualizarActividad(
    llave: string,
    campo: keyof ActividadEditable,
    valor: unknown,
  ) {
    setActividades((actuales) =>
      actuales.map((item) =>
        item.llave === llave ? { ...item, [campo]: valor } : item,
      ),
    );
  }

  const anioActual = new Date().getFullYear();
  const FECHA_FIN_SEMESTRE = `${anioActual}-12-19`;
  const fechaHoy = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  const primeraFecha = actividades[0]?.fecha;
  const minFecha =
    primeraFecha && primeraFecha > fechaHoy ? primeraFecha : fechaHoy;
  const maxFecha15 = primeraFecha
    ? sumarDias(primeraFecha, 14)
    : FECHA_FIN_SEMESTRE;
  const maxFecha =
    maxFecha15 < FECHA_FIN_SEMESTRE ? maxFecha15 : FECHA_FIN_SEMESTRE;

  function validarCambios(): string | null {
    if (
      !datosGenerales ||
      !datosGenerales.nombre.trim() ||
      !datosGenerales.descripcion.trim() ||
      !datosGenerales.justificacion.trim()
    ) {
      return "Por favor, completa todos los campos obligatorios resaltados para continuar";
    }

    if (datosGenerales.descripcion.trim().length > 500) {
      return "La descripción del evento no puede exceder 500 caracteres.";
    }

    if (actividades.length === 0) {
      return "El evento debe conservar al menos una actividad.";
    }

    for (const actividad of actividades) {
      if (!actividad.nombre.trim()) {
        return "Cada actividad debe tener un nombre.";
      }
      if (actividad.nombre.trim().length > 150) {
        return "El nombre de cada actividad no puede exceder los 150 caracteres.";
      }
      if (!actividad.descripcion.trim()) {
        return "Cada actividad debe tener una descripción.";
      }
      if (actividad.descripcion.trim().length > 500) {
        return "La descripción de cada actividad no puede exceder los 500 caracteres.";
      }
      if (!actividad.idRecinto) {
        return "Cada actividad debe tener un espacio seleccionado.";
      }
      if (!actividad.fecha) {
        return "Cada actividad debe tener una fecha seleccionada.";
      }
      if (actividad.fecha > FECHA_FIN_SEMESTRE) {
        return "Las fechas no pueden exceder el fin de semestre (19 de diciembre).";
      }
      if (!actividad.horaInicio || !actividad.horaFin) {
        return "Cada actividad debe tener horario de inicio y fin.";
      }
      if (actividad.horaInicio >= actividad.horaFin) {
        return "La hora de fin debe ser posterior a la hora de inicio.";
      }
    }

    if (actividades.length > 1) {
      const fechas = actividades.map((a) => a.fecha).filter(Boolean).sort();
      if (fechas.length > 1) {
        const primera = fechas[0];
        const ultima = fechas[fechas.length - 1];
        if (diferenciaEntreFechas(primera, ultima) > 14) {
          return "La duración máxima entre las actividades de un evento es de 15 días naturales.";
        }
      }
    }

    if (cambiosActividades && !motivo.trim()) {
      return "Escribe el motivo de la modificación logística.";
    }
    if (motivo.trim().length > 500) {
      return "El motivo no puede exceder 500 caracteres.";
    }
    return null;
  }

  async function guardarCambios(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMensaje(null);

    const errorValidacion = validarCambios();
    if (errorValidacion) {
      if (cambiosActividades && !motivo.trim()) {
        setMostrarModalMotivo(true);
      } else {
        setError(errorValidacion);
      }
      return;
    }
    if (!cambiosGenerales && !cambiosActividades) {
      setMensaje("No hay cambios para guardar.");
      return;
    }
    if (cambiosActividades && !confirmoEnvioLogistica.current) {
      setMostrarModalMotivo(true);
      return;
    }
    if (!idEvento || !evento || !datosGenerales) return;

    setGuardando(true);
    let generalesGuardados = false;
    try {
      if (cambiosGenerales) {
        const payload: ActualizarInfoGeneralPayload = {};
        if (datosGenerales.nombre !== datosGeneralesIniciales?.nombre) {
          payload.nombre = datosGenerales.nombre.trim();
        }
        if (
          datosGenerales.descripcion !== datosGeneralesIniciales?.descripcion
        ) {
          payload.descripcion = datosGenerales.descripcion.trim();
        }
        if (
          datosGenerales.justificacion !==
          datosGeneralesIniciales?.justificacion
        ) {
          payload.justificacion = datosGenerales.justificacion.trim();
        }
        if (
          datosGenerales.idAlcance !== datosGeneralesIniciales?.idAlcance &&
          datosGenerales.idAlcance !== ""
        ) {
          payload.idAlcance = datosGenerales.idAlcance;
        }

        if (archivoPoster) {
          const formData = new FormData();
          for (const [campo, valor] of Object.entries(payload)) {
            if (valor !== undefined) formData.append(campo, String(valor));
          }
          formData.append("poster", archivoPoster);
          await apiRequest(`eventos/${idEvento}/info-general`, {
            method: "PATCH",
            body: formData,
          });
        } else {
          await apiRequest(`eventos/${idEvento}/info-general`, {
            method: "PATCH",
            body: JSON.stringify(payload),
          });
        }
        generalesGuardados = true;
        setDatosGeneralesIniciales(datosGenerales);
        setArchivoPoster(null);
      }

      if (cambiosActividades) {
        const payload: ModificarLogisticaPayload = {
          motivoModificacion: motivo.trim(),
          subeventos: payloadActividades,
        };
        await apiRequest(`eventos/${idEvento}/logistica`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        setActividadesIniciales(actividades);
        setMostrarModalMotivo(false);
        setMensaje(
          "Los cambios de actividades se enviaron a revisión. Se aplicarán cuando sean aprobados.",
        );
      } else {
        setMensaje("Los cambios se guardaron correctamente.");
      }
    } catch (errorGuardado) {
      const detalle = obtenerMensajeError(errorGuardado);
      setError(
        generalesGuardados
          ? `La información general se guardó, pero no se pudo enviar la modificación de actividades: ${detalle}`
          : detalle,
      );
    } finally {
      confirmoEnvioLogistica.current = false;
      setGuardando(false);
    }
  }

  if (cargando) {
    return (
      <p role="status" className="mx-auto max-w-7xl px-4 py-8 text-gray-600">
        Cargando datos del evento...
      </p>
    );
  }

  return (
    <section className="mx-auto w-full max-w-7xl space-y-8 px-4 sm:px-6 lg:space-y-10 lg:px-8">
      <button
        type="button"
        className="flex cursor-pointer items-center gap-2"
        onClick={() =>
          navigate(`/organizador/administrar-evento-subeventos/${idEvento}`)
        }>
        <ArrowLeft size={20} aria-hidden="true" />
        <span>Volver</span>
      </button>

      <h1 className="font-merriweather text-2xl font-semibold leading-tight sm:text-3xl">
        Modificar detalles del evento
      </h1>
      {evento?.posterUrl && (
        <EventBanner
          eventName={datosGenerales?.nombre ?? evento.nombre}
          posterUrl={evento.posterUrl}
        />
      )}

      {error && (
        <Modal
          titulo="Error"
          contenido={error}
          mostrarModal={Boolean(error)}
          cerrarModal={() => setError(null)}>
          <Button
            text="Cerrar"
            variant="primary"
            type="button"
            onClick={() => setError(null)}
          />
        </Modal>
      )}

      {mensaje && (
        <div>
          <Badge variant="success">{mensaje}</Badge>
        </div>
      )}

      {evento?.solicitudModificacionPendiente && (
        <div
          role="status"
          className="space-y-2 rounded-lg border border-amber-300 bg-amber-50 p-5 text-amber-950 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-md bg-amber-200 px-2.5 py-0.5 text-xs font-semibold text-amber-900">
              Solicitud en Revisión
            </span>
            <h2 className="text-base font-bold text-amber-950">
              Modificación logística pendiente de evaluación por Subdirección
            </h2>
          </div>
          <p className="text-sm text-amber-900">
            <span className="font-semibold">Motivo registrado:</span>{" "}
            {evento.solicitudModificacionPendiente.motivoModificacion}
          </p>
          <p className="text-xs text-amber-800">
            Mientras Subdirección dictamina esta solicitud, el evento conserva
            vigentes sus fechas y espacios originales. Si realizas otro cambio
            logístico, se actualizará esta misma solicitud sin generar
            duplicados.
          </p>
        </div>
      )}

      {datosGenerales && (
        <form
          data-editar-evento-subeventos
          onSubmit={guardarCambios}
          className="space-y-8">
          <fieldset disabled={guardando} className="space-y-8 border-0 p-0">
            <section className="space-y-4 border border-gray-200 bg-white p-5 shadow-md">
              <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
                <div className="w-fit">
                  <FormField
                    className="!font-bold !text-black"
                    label="Banner del evento"
                    mensajeAyuda="Resolución: 2048 x 1152">
                    <InputFile
                      id="campoPoster"
                      accept=".jpg"
                      disabled={guardando}
                      onChange={(event) =>
                        setArchivoPoster(event.currentTarget.files?.[0] ?? null)
                      }
                    />
                  </FormField>
                </div>
                <div id="contenedorAlcance" className="max-w-xs">
                  <FormField
                    label="Alcance"
                    htmlFor="campoAlcance"
                    className="!font-bold !text-black">
                    <Select
                      id="campoAlcance"
                      placeholder="Selecciona una opción"
                      options={ALCANCES}
                      value={
                        datosGenerales.idAlcance === ""
                          ? ""
                          : String(datosGenerales.idAlcance)
                      }
                      disabled={guardando}
                      onChange={(event) => {
                        const valor = Number(event.currentTarget.value);
                        if (
                          valor === AlcanceEvento.PUBLICO ||
                          valor === AlcanceEvento.INTERNO ||
                          valor === AlcanceEvento.PRIVADO
                        ) {
                          setDatosGenerales({
                            ...datosGenerales,
                            idAlcance: valor,
                          });
                        }
                      }}
                    />
                  </FormField>
                </div>
              </div>
              <div id="contenedorNombre" className="relative">
                <Pencil
                  size={18}
                  aria-hidden="true"
                  className="absolute right-3 top-10 text-gray-500"
                />
                <FormField
                  label="Nombre del evento"
                  className="!font-bold !text-black">
                  <Input
                    id="campoNombre"
                    className="pr-10 font-merriweather text-xl font-bold text-secondary sm:text-2xl"
                    value={datosGenerales.nombre}
                    maxLength={150}
                    onChange={(event) =>
                      setDatosGenerales({
                        ...datosGenerales,
                        nombre: event.currentTarget.value,
                      })
                    }
                  />
                </FormField>
              </div>

              <div id="contenedorDescripcion" className="relative">
                <Pencil
                  size={18}
                  aria-hidden="true"
                  className="absolute right-3 top-10 text-gray-500"
                />
                <FormField
                  label="Descripción del evento"
                  className="!font-bold !text-black"
                  errorMessage={
                    !datosGenerales.descripcion.trim()
                      ? "La descripción es obligatoria"
                      : datosGenerales.descripcion.trim().length >= 500
                        ? "La descripción no puede exceder los 500 caracteres"
                        : ""
                  }>
                  <TextArea
                    value={datosGenerales.descripcion}
                    maxLength={500}
                    className="resize-none"
                    hasError={
                      datosGenerales.descripcion.trim().length >= 500 ||
                      !datosGenerales.descripcion.trim()
                    }
                    onChange={(event) =>
                      setDatosGenerales({
                        ...datosGenerales,
                        descripcion: event.currentTarget.value,
                      })
                    }
                  />
                </FormField>
              </div>

              <div id="contenedorJustificacion" className="relative">
                <Pencil
                  size={18}
                  aria-hidden="true"
                  className="absolute right-3 top-10 text-gray-500"
                />
                <FormField
                  label="Beneficio politécnico"
                  className="!font-bold !text-black">
                  <TextArea
                    value={datosGenerales.justificacion}
                    maxLength={500}
                    className="resize-none"
                    onChange={(event) =>
                      setDatosGenerales({
                        ...datosGenerales,
                        justificacion: event.currentTarget.value,
                      })
                    }
                  />
                </FormField>
              </div>

              <div id="contenedorLogistica" className="space-y-4 pt-2">
                <h3 className="text-lg font-bold">
                  Personal de logística del evento
                </h3>
                {(evento?.personalLogistica ?? []).length > 0 ? (
                  <div className="w-full min-w-0 overflow-x-auto rounded-md border border-gray-200 shadow-sm">
                    <Table
                      columnas={columnasLogistica}
                      filas={evento?.personalLogistica ?? []}
                      obtenerClave={(personal) => personal.idUsuario}
                      className="table-auto min-w-full bg-white text-left text-sm [&_tbody_tr]:h-12 [&_thead_tr]:h-10 [&_th]:py-2 [&_td]:py-2"
                    />
                  </div>
                ) : (
                  <p className="text-gray-600">
                    No hay personal de logística registrado para este evento.
                  </p>
                )}
                <Button
                  text="Agregar personal de logística"
                  variant="primary"
                  type="button"
                />
              </div>
            </section>

            <section className="space-y-5">
              <h2 className="text-xl font-bold sm:text-2xl">Actividades</h2>

              {actividades.map((actividad, indice) => {
                const recinto = recintos.find(
                  (item) => String(item.idRecinto) === actividad.idRecinto,
                );
                if (actividad.idSubEvento !== undefined) {
                  const subevento: OrganizerSubeventCardData = {
                    idSubEvento: actividad.idSubEvento,
                    nombre: actividad.nombre,
                    descripcion: actividad.descripcion,
                    accesoQR: actividad.accesoQR,
                    fecha: actividad.fecha
                      ? {
                          fecha: actividad.fecha,
                          horaInicio: actividad.horaInicio,
                          horaFin: actividad.horaFin,
                        }
                      : null,
                    recinto: recinto
                      ? {
                          idRecinto: recinto.idRecinto,
                          nombre: recinto.nombre,
                          aforo: recinto.aforo,
                        }
                      : null,
                  };

                  return (
                    <OrganizerSubeventCard
                      key={actividad.llave}
                      idEvento={Number(idEvento)}
                      subevento={subevento}
                      onCancel={(motivoCancelacion) => {
                        setMotivo(motivoCancelacion);
                        quitarActividad(actividad.llave);
                      }}
                    />
                  );
                }

                return (
                  <div
                    key={actividad.llave}
                    className="grid min-w-0 grid-cols-1 gap-4 rounded-md bg-eventos-primary-light p-4 sm:grid-cols-2 sm:p-6 lg:grid-cols-3 lg:px-10 lg:py-8">
                    <FormField
                      label="Fecha"
                      htmlFor={`selectFecha-${indice}`}
                      required
                      mensajeAyuda={
                        primeraFecha
                          ? "Máximo 15 días a partir de la fecha de inicio"
                          : undefined
                      }>
                      <Input
                        id={`selectFecha-${indice}`}
                        min={minFecha}
                        max={maxFecha}
                        type="date"
                        value={actividad.fecha}
                        onChange={(e) =>
                          actualizarActividad(
                            actividad.llave,
                            "fecha",
                            e.target.value,
                          )
                        }
                      />
                    </FormField>

                    <FormField
                      label="Espacio deseado"
                      htmlFor={`selectRecinto-${indice}`}
                      required>
                      <Select
                        id={`selectRecinto-${indice}`}
                        placeholder="Selecciona un espacio"
                        options={recintos.map((r) => ({
                          value: String(r.idRecinto),
                          label:
                            r.aforo > 0
                              ? `${r.nombre} (Aforo: ${r.aforo} personas)`
                              : r.nombre,
                        }))}
                        value={actividad.idRecinto}
                        onChange={(e) => {
                          const idRecintoNum = Number(e.target.value);
                          actualizarActividad(
                            actividad.llave,
                            "idRecinto",
                            e.target.value,
                          );
                          if (idRecintoNum === RecintoId.SALA_14) {
                            actualizarActividad(
                              actividad.llave,
                              "accesoQR",
                              false,
                            );
                          }
                        }}
                      />
                    </FormField>

                    <FormField
                      label="Hora inicio"
                      htmlFor={`selectHoraInicio-${indice}`}
                      required>
                      <Select
                        id={`selectHoraInicio-${indice}`}
                        placeholder="Selecciona la hora de inicio"
                        options={HORAS_INICIO}
                        value={actividad.horaInicio}
                        disabled={!actividad.fecha || !actividad.idRecinto}
                        onChange={(e) =>
                          actualizarActividad(
                            actividad.llave,
                            "horaInicio",
                            e.target.value,
                          )
                        }
                      />
                    </FormField>

                    <FormField
                      label="Hora Fin"
                      htmlFor={`selectHoraFinal-${indice}`}
                      required>
                      <Select
                        id={`selectHoraFinal-${indice}`}
                        placeholder="Selecciona la hora final"
                        options={
                          actividad.horaInicio
                            ? HORAS_FIN.filter(
                                (h) => h.value > actividad.horaInicio,
                              )
                            : HORAS_FIN
                        }
                        value={actividad.horaFin}
                        disabled={
                          !actividad.fecha ||
                          !actividad.idRecinto ||
                          !actividad.horaInicio
                        }
                        onChange={(e) =>
                          actualizarActividad(
                            actividad.llave,
                            "horaFin",
                            e.target.value,
                          )
                        }
                      />
                    </FormField>

                    <FormField
                      label="Acceso con boleto"
                      htmlFor={`selectBoleto-${indice}`}
                      required={Number(actividad.idRecinto) !== RecintoId.SALA_14}
                      mensajeAyuda={
                        Number(actividad.idRecinto) === RecintoId.SALA_14
                          ? "Al elegir la sala 14 el acceso es libre"
                          : Number(actividad.idRecinto) === RecintoId.LABORATORIO_A ||
                              Number(actividad.idRecinto) === RecintoId.LABORATORIO_B
                            ? "Al elegir un laboratorio el cupo pasa a ser limitado"
                            : ""
                      }>
                      <Select
                        id={`selectBoleto-${indice}`}
                        placeholder="Selecciona una opción"
                        options={ACCESOS}
                        className="disabled:cursor-not-allowed disabled:text-gray-500"
                        value={
                          actividad.accesoQR !== undefined
                            ? String(actividad.accesoQR)
                            : ""
                        }
                        disabled={Number(actividad.idRecinto) !== RecintoId.AUDITORIO}
                        onChange={(e) =>
                          actualizarActividad(
                            actividad.llave,
                            "accesoQR",
                            e.target.value === "true",
                          )
                        }
                      />
                    </FormField>

                    <FormField
                      label={undefined}
                      htmlFor={`botonEspacio-${indice}`}>
                      <Button
                        id={`botonEspacio-${indice}`}
                        text="Ver detalles del laboratorio"
                        type="button"
                        disabled={
                          Number(actividad.idRecinto) === RecintoId.SALA_14 ||
                          Number(actividad.idRecinto) === RecintoId.AUDITORIO ||
                          !actividad.idRecinto
                        }
                        className="w-full sm:w-auto"
                        onClick={() =>
                          setModalEspacio({
                            id: Number(actividad.idRecinto),
                            nombre:
                              recintos.find(
                                (r) => String(r.idRecinto) === actividad.idRecinto,
                              )?.nombre ?? "Espacio seleccionado",
                          })
                        }
                      />
                    </FormField>

                    <div className="col-span-full flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div id="contenedorBotonesCard">
                        <Button
                          text="Nombre y descripción del subevento"
                          id={`botonVerInformacion-${actividad.llave}`}
                          type="button"
                          className="w-full sm:w-auto"
                          onClick={() =>
                            setModalSubeventoAbierto(actividad.llave)
                          }
                        />
                      </div>

                      <ModalSubevento
                        mostrar={modalSubeventoAbierto === actividad.llave}
                        nombre={actividad.nombre}
                        descripcion={actividad.descripcion}
                        errores={{}}
                        cambiarNombre={(valor) =>
                          actualizarActividad(actividad.llave, "nombre", valor)
                        }
                        cambiarDescripcion={(valor) =>
                          actualizarActividad(
                            actividad.llave,
                            "descripcion",
                            valor,
                          )
                        }
                        cerrar={() => setModalSubeventoAbierto(null)}
                      />

                      <Button
                        text="Eliminar fecha"
                        id={`botonEliminar-${actividad.llave}`}
                        type="button"
                        variant="danger"
                        className="w-full sm:w-auto"
                        onClick={() => quitarActividad(actividad.llave)}
                      />
                    </div>
                  </div>
                );
              })}
            </section>
          </fieldset>

          <div id="contenedorBotones" className="flex justify-end gap-3">
            <Button
              text="Agregar actividad"
              variant="primary"
              type="button"
              onClick={agregarActividad}
            />
            <Button
              text="Guardar cambios"
              variant="primary"
              type="submit"
              loading={guardando}
              loadingText="Guardando..."
            />
          </div>
        </form>
      )}

      {mostrarModalMotivo && (
        <Modal
          titulo="Motivo de modificación logística"
          contenido="Los cambios en las actividades requieren una nueva revisión por parte de Subdirección. Ingrese el motivo de la modificación para continuar."
          mostrarModal={mostrarModalMotivo}
          cerrarModal={() => setMostrarModalMotivo(false)}>
          <FormField
            label="Motivo de modificación"
            className="!font-bold !text-black"
            errorMessage={
              !motivo.trim()
                ? "El motivo de modificación es obligatorio."
                : motivo.trim().length > 500
                  ? "El motivo no puede exceder los 500 caracteres."
                  : ""
            }>
            <TextArea
              id="motivoModificacionLogistica"
              className="h-32 resize-none"
              value={motivo}
              maxLength={500}
              placeholder="Explica la razón por la que se modifican, agregan o cancelan las actividades..."
              onChange={(e) => setMotivo(e.currentTarget.value)}
            />
          </FormField>
          <div className="mt-4 flex justify-end gap-3">
            <Button
              text="Cancelar"
              variant="secondary"
              type="button"
              onClick={() => setMostrarModalMotivo(false)}
            />
            <Button
              text="Confirmar y guardar"
              variant="primary"
              type="button"
              disabled={!motivo.trim() || motivo.trim().length > 500}
              onClick={() => {
                if (!motivo.trim()) return;
                confirmoEnvioLogistica.current = true;
                setMostrarModalMotivo(false);
                const form = document.querySelector<HTMLFormElement>(
                  "form[data-editar-evento-subeventos]",
                );
                if (form) {
                  form.requestSubmit();
                }
              }}
            />
          </div>
        </Modal>
      )}

      {modalEspacio && (
        <SpaceRequerimentsDialog
          mostrar={Boolean(modalEspacio)}
          laboratorio={modalEspacio.nombre}
          id={modalEspacio.id}
          cerrar={() => setModalEspacio(null)}
        />
      )}
    </section>
  );
}
