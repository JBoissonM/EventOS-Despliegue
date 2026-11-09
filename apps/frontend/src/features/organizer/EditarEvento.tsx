import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams } from "react-router";
import {
  AlcanceEvento,
  EstadoEvento,
  type ActualizarInfoGeneralPayload,
  type EventoOrganizadorDetalle,
  type ModificarLogisticaPayload,
  type PersonalLogisticaItem,
  type Recinto,
} from "@eventos/shared";
import { ArrowLeft, Pencil } from "lucide-react";
import { Input } from "../../components/atoms/Input/Input";
import { InputFile } from "../../components/atoms/InputFile/InputFile";
import { Select } from "../../components/atoms/Select/Select";
import { TextArea } from "../../components/atoms/TextArea/TextArea";
import { Table } from "../../components/organisms/Table/Table";
import type { Columna } from "../../components/organisms/Table/Table";
import Button from "../../components/atoms/Button/Button";
import { EditLogisticsSection } from "./organism/EditLogisticsSection";
import type {
  EditLogisticsValues,
  HorarioOcupado,
} from "./organism/EditLogisticsSection";
import { apiRequest } from "../../lib/apiClient";
import { EventBanner } from "../event-details/components/molecules/EventBanner";
import Badge from "../../components/atoms/Badge/Badge";
import { FormField } from "../../components/molecules/FormField";
import { Modal } from "../../components/molecules/Modal";
import {
  MARCADOR_MOTIVO_URGENCIA,
  ModalMotivo,
} from "./organism/ModalMotivo";
import { ModalMotivoUrgente } from "../../components/organisms/ModalMotivoUrgente/ModalMotivoUrgente";

type TablaPonente = {
  id: number;
  nombre: string;
  correo: string;
};

const ALCANCES = [
  { value: String(AlcanceEvento.PUBLICO), label: "Público" },
  { value: String(AlcanceEvento.INTERNO), label: "Interno" },
  { value: String(AlcanceEvento.PRIVADO), label: "Privado" },
];

function separarMotivoUrgencia(motivo: string) {
  const indice = motivo.lastIndexOf(MARCADOR_MOTIVO_URGENCIA);
  if (indice < 0) {
    return { motivoModificacion: motivo, motivoUrgente: "" };
  }

  return {
    motivoModificacion: motivo.slice(0, indice),
    motivoUrgente: motivo.slice(indice + MARCADOR_MOTIVO_URGENCIA.length),
  };
}

function diasHastaFecha(fecha: string): number | null {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  if (!anio || !mes || !dia) return null;

  const hoy = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(new Date())
    .split("-")
    .map(Number);

  const fechaUTC = Date.UTC(anio, mes - 1, dia);
  const hoyUTC = Date.UTC(hoy[0], hoy[1] - 1, hoy[2]);
  return (fechaUTC - hoyUTC) / 86_400_000;
}

const columnasPonente: Columna<TablaPonente>[] = [
  {
    id: "nombre",
    encabezado: "Nombre",
    render: (ponente) => ponente.nombre,
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

function obtenerMensajeError(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Ocurrió un error inesperado.";
}

function obtenerValoresLogistica(
  evento: EventoOrganizadorDetalle,
  idSubEvento?: number,
): EditLogisticsValues {
  const subevento = idSubEvento
    ? evento.subEventos.find((item) => item.idSubEvento === idSubEvento)
    : evento.subEventos[0];
  if (!subevento) {
    throw new Error("El evento no tiene un subevento que se pueda modificar.");
  }
  const propuesta =
    evento.solicitudModificacionPendiente?.subeventosPropuestos.find(
      (item) => item.idSubEvento === subevento.idSubEvento,
    );

  return {
    idRecinto: String(
      propuesta?.idRecinto ?? subevento.recinto?.idRecinto ?? "",
    ),
    fecha: propuesta?.fecha ?? subevento.fecha?.fecha.slice(0, 10) ?? "",
    horaInicio:
      propuesta?.horaInicio.slice(0, 5) ??
      subevento.fecha?.horaInicio.slice(0, 5) ??
      "",
    horaFin:
      propuesta?.horaFin.slice(0, 5) ??
      subevento.fecha?.horaFin.slice(0, 5) ??
      "",
    accesoQR: String(propuesta?.accesoQR ?? subevento.accesoQR),
    motivoModificacion:
      evento.solicitudModificacionPendiente?.motivoModificacion ?? "",
  };
}

function esEventoNoEditable(estado?: EstadoEvento): boolean {
  if (estado === undefined) return false;
  return [
    EstadoEvento.CANCELADO,
    EstadoEvento.FINALIZADO,
    EstadoEvento.RECHAZADO,
  ].includes(estado);
}

export function EditarEvento() {
  const navigate = useNavigate();
  const { idEvento, idSubEvento } = useParams();
  const idSubEventoSeleccionado = idSubEvento ? Number(idSubEvento) : undefined;
  const rutaAdministracion = idSubEventoSeleccionado
    ? `/organizador/administrar-evento-subeventos/${idEvento}`
    : `/organizador/administrar-evento/${idEvento}`;
  const [evento, setEvento] = useState<EventoOrganizadorDetalle | null>(null);
  const [recintos, setRecintos] = useState<Recinto[]>([]);
  const [agendaOcupada, setAgendaOcupada] = useState<HorarioOcupado[]>([]);
  const [cargandoAgenda, setCargandoAgenda] = useState(false);
  const [errorAgenda, setErrorAgenda] = useState<string | null>(null);
  const [errorRecintos, setErrorRecintos] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [intentoGuardar, setIntentoGuardar] = useState(false);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [justificacion, setJustificacion] = useState("");
  const [alcance, setAlcance] = useState<AlcanceEvento | "">("");
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarModalAviso, setMostrarModalAviso] = useState(false);
  const [mostrarModalUrgente, setMostrarModalUrgente] = useState(false);
  const [mostrarModalRegreso, setMostrarModalRegreso] = useState(false);
  const [intentoMotivo, setIntentoMotivo] = useState(false);
  const [motivoUrgente, setMotivoUrgente] = useState("");
  const [logistica, setLogistica] = useState<EditLogisticsValues>({
    idRecinto: "",
    fecha: "",
    horaInicio: "",
    horaFin: "",
    accesoQR: "",
    motivoModificacion: "",
  });
  const [logisticaInicial, setLogisticaInicial] =
    useState<EditLogisticsValues | null>(null);
  const [archivoPoster, setArchivoPoster] = useState<File | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const cargar = async () => {
      setCargando(true);
      setEvento(null);
      setError(null);
      setMensaje(null);
      setErrorRecintos(null);
      setRecintos([]);

      if (!idEvento || !/^\d+$/.test(idEvento) || Number(idEvento) < 1) {
        setError("El ID del evento no es válido.");
        setCargando(false);
        return;
      }
      if (
        idSubEvento !== undefined &&
        (!/^\d+$/.test(idSubEvento) || Number(idSubEvento) < 1)
      ) {
        setError("El ID del subevento no es válido.");
        setCargando(false);
        return;
      }
      if (!localStorage.getItem("token")) {
        setError("Sesión no iniciada.");
        setCargando(false);
        return;
      }

      const resultadoRecintos = apiRequest<Recinto[]>("espacios/disponibles", {
        signal: controller.signal,
      }).then(
        (lista) => setRecintos(lista),
        (errorRecinto: unknown) => {
          if (!controller.signal.aborted) {
            setErrorRecintos(obtenerMensajeError(errorRecinto));
          }
        },
      );

      try {
        const detalle = await apiRequest<EventoOrganizadorDetalle>(
          `eventos/${idEvento}/detalle-organizador`,
          { signal: controller.signal },
        );
        if (controller.signal.aborted) return;
        if (
          idSubEventoSeleccionado !== undefined &&
          !detalle.subEventos.some(
            (item) => item.idSubEvento === idSubEventoSeleccionado,
          )
        ) {
          throw new Error("El subevento no pertenece a este evento.");
        }

        setEvento(detalle);
        const subeventoSeleccionado =
          idSubEventoSeleccionado !== undefined
            ? detalle.subEventos.find(
                (item) => item.idSubEvento === idSubEventoSeleccionado,
              )
            : undefined;
        const propuestaSubevento =
          subeventoSeleccionado &&
          detalle.solicitudModificacionPendiente?.subeventosPropuestos.find(
            (item) => item.idSubEvento === subeventoSeleccionado.idSubEvento,
          );
        setNombre(propuestaSubevento?.nombre ?? subeventoSeleccionado?.nombre ?? detalle.nombre);
        setDescripcion(
          propuestaSubevento?.descripcion ??
            subeventoSeleccionado?.descripcion ??
            detalle.descripcion,
        );
        setJustificacion(detalle.justificacion ?? "");
        setAlcance(detalle.idAlcance ?? "");
        const valoresLogistica = obtenerValoresLogistica(
          detalle,
          idSubEventoSeleccionado,
        );
        const motivos = separarMotivoUrgencia(
          valoresLogistica.motivoModificacion,
        );
        const valoresConMotivo = {
          ...valoresLogistica,
          motivoModificacion: motivos.motivoModificacion,
        };
        setLogistica(valoresConMotivo);
        setLogisticaInicial(valoresConMotivo);
        setMotivoUrgente(motivos.motivoUrgente);
        setArchivoPoster(null);
      } catch (errorCarga) {
        if (!controller.signal.aborted) {
          setError(obtenerMensajeError(errorCarga));
        }
      } finally {
        await resultadoRecintos;
        if (!controller.signal.aborted) {
          setCargando(false);
        }
      }
    };

    void cargar();
    return () => controller.abort();
  }, [idEvento, idSubEvento, idSubEventoSeleccionado]);

  useEffect(() => {
    if (!logistica.idRecinto || !logistica.fecha) {
      setAgendaOcupada([]);
      setCargandoAgenda(false);
      setErrorAgenda(null);
      return;
    }

    const controller = new AbortController();
    setAgendaOcupada([]);
    setCargandoAgenda(true);
    setErrorAgenda(null);

    const consultarAgenda = async () => {
      try {
        const respuesta = await apiRequest<{ agenda: HorarioOcupado[] }>(
          `espacios/${logistica.idRecinto}/horarios-disponibles?fecha=${encodeURIComponent(logistica.fecha)}`,
          { signal: controller.signal },
        );
        if (!controller.signal.aborted) {
          setAgendaOcupada(
            respuesta.agenda.filter(
              (horario) => horario.idEvento !== Number(idEvento),
            ),
          );
        }
      } catch (errorConsulta) {
        if (!controller.signal.aborted) {
          setErrorAgenda(obtenerMensajeError(errorConsulta));
        }
      } finally {
        if (!controller.signal.aborted) {
          setCargandoAgenda(false);
        }
      }
    };

    void consultarAgenda();
    return () => controller.abort();
  }, [idEvento, logistica.fecha, logistica.idRecinto]);

  const subevento = idSubEventoSeleccionado
    ? evento?.subEventos.find(
        (item) => item.idSubEvento === idSubEventoSeleccionado,
      ) ?? null
    : evento?.subEventos[0] ?? null;
  const subeventoPropuesto = idSubEventoSeleccionado
    ? evento?.solicitudModificacionPendiente?.subeventosPropuestos.find(
        (item) => item.idSubEvento === idSubEventoSeleccionado,
      )
    : undefined;
  const ponentes: TablaPonente[] =
    subevento?.ponentes.map((ponente) => ({
      id: ponente.idPonente,
      nombre: [ponente.nombre, ponente.apellidoPa, ponente.apellidoMa]
        .filter(Boolean)
        .join(" "),
      correo: ponente.correo,
    })) ?? [];
  const personalLogistica = evento?.personalLogistica ?? [];
  const recintoActual =
    recintos.find(
      (recinto) => String(recinto.idRecinto) === logistica.idRecinto,
    ) ??
    subevento?.recinto ??
    null;
  const informacionGeneralModificada = Boolean(
    evento &&
    (idSubEventoSeleccionado === undefined
      ? nombre !== evento.nombre ||
        descripcion !== evento.descripcion ||
        justificacion !== (evento.justificacion ?? "") ||
        alcance !== (evento.idAlcance ?? "") ||
        archivoPoster
      : subevento &&
        (nombre !== (subeventoPropuesto?.nombre ?? subevento.nombre) ||
          descripcion !==
            (subeventoPropuesto?.descripcion ?? subevento.descripcion))),
  );
  const camposLogisticosModificados = Boolean(
    subevento &&
    logisticaInicial &&
    (logistica.idRecinto !== logisticaInicial.idRecinto ||
      logistica.fecha !== logisticaInicial.fecha ||
      logistica.horaInicio !== logisticaInicial.horaInicio ||
      logistica.horaFin !== logisticaInicial.horaFin ||
      logistica.accesoQR !== logisticaInicial.accesoQR),
  );
  const cambioLogisticoOperativo = Boolean(
    subevento &&
      logisticaInicial &&
      (logistica.idRecinto !== logisticaInicial.idRecinto ||
        logistica.fecha !== logisticaInicial.fecha ||
        logistica.horaInicio !== logisticaInicial.horaInicio ||
        logistica.horaFin !== logisticaInicial.horaFin),
  );
  const diasParaFechaPropuesta = diasHastaFecha(logistica.fecha);
  const esModificacionUrgente =
    cambioLogisticoOperativo &&
    diasParaFechaPropuesta !== null &&
    diasParaFechaPropuesta >= 0 &&
    diasParaFechaPropuesta <= 7;
  const logisticaModificada =
    camposLogisticosModificados ||
    Boolean(
      evento?.solicitudModificacionPendiente &&
      logisticaInicial &&
      logistica.motivoModificacion !== logisticaInicial.motivoModificacion,
    );

  function cambiarLogistica<K extends keyof EditLogisticsValues>(
    campo: K,
    valor: EditLogisticsValues[K],
  ) {
    if (campo === "idRecinto" || campo === "fecha") {
      const idRecinto =
        campo === "idRecinto" ? String(valor) : logistica.idRecinto;
      const fecha = campo === "fecha" ? String(valor) : logistica.fecha;
      setAgendaOcupada([]);
      setErrorAgenda(null);
      setCargandoAgenda(Boolean(idRecinto && fecha));
    }
    setLogistica((actual) => ({ ...actual, [campo]: valor }));
  }

  async function obtenerDetalleActualizado(): Promise<EventoOrganizadorDetalle> {
    if (!idEvento) throw new Error("El ID del evento no es válido.");
    return apiRequest<EventoOrganizadorDetalle>(
      `eventos/${idEvento}/detalle-organizador`,
    );
  }

  async function sincronizarEstadoDetalle(
    detalleActualizado: EventoOrganizadorDetalle,
  ) {
    const valoresLogisticaActualizados = obtenerValoresLogistica(
      detalleActualizado,
      idSubEventoSeleccionado,
    );
    const motivosActualizados = separarMotivoUrgencia(
      valoresLogisticaActualizados.motivoModificacion,
    );
    const valoresActualizadosConMotivo = {
      ...valoresLogisticaActualizados,
      motivoModificacion: motivosActualizados.motivoModificacion,
    };
    const subeventoActualizado = idSubEventoSeleccionado
      ? detalleActualizado.subEventos.find(
          (item) => item.idSubEvento === idSubEventoSeleccionado,
        )
      : undefined;
    const propuestaActualizada =
      subeventoActualizado &&
      detalleActualizado.solicitudModificacionPendiente?.subeventosPropuestos.find(
        (item) => item.idSubEvento === subeventoActualizado.idSubEvento,
      );
    setEvento(detalleActualizado);
    setNombre(
      propuestaActualizada?.nombre ??
        subeventoActualizado?.nombre ??
        detalleActualizado.nombre,
    );
    setDescripcion(
      propuestaActualizada?.descripcion ??
        subeventoActualizado?.descripcion ??
        detalleActualizado.descripcion,
    );
    setJustificacion(detalleActualizado.justificacion ?? "");
    setAlcance(detalleActualizado.idAlcance ?? "");
    setLogistica(valoresActualizadosConMotivo);
    setLogisticaInicial(valoresActualizadosConMotivo);
    setMotivoUrgente(motivosActualizados.motivoUrgente);
    setArchivoPoster(null);
  }

  async function guardarInformacionGeneral() {
    setIntentoGuardar(true);
    if (!evento || !subevento || !idEvento) return;

    setError(null);
    setMensaje(null);

    if (!informacionGeneralModificada) {
      setMensaje("No hay cambios en la información general para guardar.");
      return;
    }

    if (
      !nombre.trim() ||
      !descripcion.trim() ||
      (idSubEventoSeleccionado === undefined && !justificacion.trim())
    ) {
      setError(
        "Por favor, completa todos los campos obligatorios resaltados para continuar",
      );
      return;
    }
    if (nombre.trim().length > 150) {
      setError("El nombre no puede exceder 150 caracteres.");
      return;
    }
    if (descripcion.trim().length > 500) {
      setError("La descripción no puede exceder 500 caracteres.");
      return;
    }

    setGuardando(true);
    try {
      const payload: ActualizarInfoGeneralPayload = {};
      if (idSubEventoSeleccionado !== undefined) {
        payload.idSubEvento = idSubEventoSeleccionado;
        payload.nombre = nombre.trim();
        payload.descripcion = descripcion.trim();
      } else {
        if (nombre !== evento.nombre) {
          payload.nombre = nombre.trim();
        }
        if (descripcion !== evento.descripcion) {
          payload.descripcion = descripcion.trim();
        }
        if (justificacion !== (evento.justificacion ?? "")) {
          payload.justificacion = justificacion.trim();
        }
        if (alcance !== (evento.idAlcance ?? "") && alcance !== "") {
          payload.idAlcance = alcance;
        }
      }

      if (archivoPoster && idSubEventoSeleccionado === undefined) {
        const datos = new FormData();
        for (const [campo, valor] of Object.entries(payload)) {
          if (valor !== undefined) datos.append(campo, String(valor));
        }
        datos.append("poster", archivoPoster);
        await apiRequest(`eventos/${idEvento}/info-general`, {
          method: "PATCH",
          body: datos,
        });
      } else {
        await apiRequest(`eventos/${idEvento}/info-general`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      }

      const detalleActualizado = await obtenerDetalleActualizado();
      await sincronizarEstadoDetalle(detalleActualizado);
      setMensaje(
        idSubEventoSeleccionado !== undefined
          ? "Los datos de la actividad se actualizaron de inmediato."
          : "La información general del evento se actualizó de inmediato.",
      );
    } catch (errorOperacion) {
      setError(obtenerMensajeError(errorOperacion));
    } finally {
      setGuardando(false);
    }
  }

  function solicitarConfirmacionLogistica() {
    setIntentoMotivo(true);
    if (
      !logistica.motivoModificacion.trim() ||
      logistica.motivoModificacion.trim().length > 500
    ) {
      return;
    }

    setMostrarModal(false);
    if (esModificacionUrgente) {
      setMostrarModalUrgente(true);
    } else {
      setMostrarModalAviso(true);
    }
  }

  function confirmarEnvioLogistica() {
    setMostrarModalAviso(false);
    void guardarCambiosLogistica(true);
  }

  async function guardarCambiosLogistica(confirmarMotivoLogistica = false) {
    if (!evento || !subevento || !idEvento) return;

    setError(null);
    setMensaje(null);

    if (!logisticaModificada) {
      setMensaje("No hay cambios logísticos para enviar a revisión.");
      return;
    }

    const motivoModificacionCompleto = esModificacionUrgente
      ? `${logistica.motivoModificacion.trim()}${MARCADOR_MOTIVO_URGENCIA}${motivoUrgente.trim()}`
      : logistica.motivoModificacion.trim();

    if (cargandoAgenda || errorAgenda) {
      setError(
        cargandoAgenda
          ? "Espera a que termine la consulta de disponibilidad del espacio."
          : `No se pudo comprobar la disponibilidad del espacio: ${errorAgenda}`,
      );
      return;
    }
    if (
      !logistica.idRecinto ||
      !logistica.fecha ||
      !logistica.horaInicio ||
      !logistica.horaFin
    ) {
      setError("Completa espacio, fecha y horarios de la modificación.");
      return;
    }
    if (logistica.horaInicio >= logistica.horaFin) {
      setError("La hora de finalización debe ser posterior a la de inicio.");
      return;
    }
    if (!confirmarMotivoLogistica) {
      setIntentoMotivo(false);
      setMostrarModal(true);
      return;
    }
    setIntentoMotivo(true);
    if (
      !logistica.motivoModificacion.trim() ||
      logistica.motivoModificacion.trim().length > 500
    ) {
      return;
    }
    if (esModificacionUrgente && !motivoUrgente.trim()) {
      setError("Escribe el motivo de urgencia para continuar.");
      return;
    }
    if (motivoModificacionCompleto.length > 500) {
      setError(
        "Reduce el motivo de modificación o el de urgencia para que ambos no excedan 500 caracteres en total.",
      );
      return;
    }

    setMostrarModal(false);
    setGuardando(true);
    try {
      const subeventosAEnviar = evento.subEventos.map((otroSub) => {
        if (otroSub.idSubEvento === subevento.idSubEvento) {
          return {
            idSubEvento: subevento.idSubEvento,
            nombre:
              idSubEventoSeleccionado !== undefined
                ? nombre.trim() || subevento.nombre
                : subevento.nombre,
            descripcion:
              idSubEventoSeleccionado !== undefined
                ? descripcion.trim() || subevento.descripcion
                : subevento.descripcion,
            idRecinto: Number(logistica.idRecinto),
            accesoQR: logistica.accesoQR === "true",
            fecha: logistica.fecha,
            horaInicio: logistica.horaInicio,
            horaFin: logistica.horaFin,
          };
        }

        const propuesta =
          evento.solicitudModificacionPendiente?.subeventosPropuestos.find(
            (p) => p.idSubEvento === otroSub.idSubEvento,
          );

        return {
          idSubEvento: otroSub.idSubEvento,
          nombre: propuesta?.nombre ?? otroSub.nombre,
          descripcion: propuesta?.descripcion ?? otroSub.descripcion,
          idRecinto: propuesta?.idRecinto ?? otroSub.recinto?.idRecinto ?? 0,
          accesoQR: propuesta?.accesoQR ?? otroSub.accesoQR,
          fecha: propuesta?.fecha ?? otroSub.fecha?.fecha.slice(0, 10) ?? "",
          horaInicio:
            propuesta?.horaInicio.slice(0, 5) ??
            otroSub.fecha?.horaInicio.slice(0, 5) ??
            "",
          horaFin:
            propuesta?.horaFin.slice(0, 5) ??
            otroSub.fecha?.horaFin.slice(0, 5) ??
            "",
        };
      });

      const payload: ModificarLogisticaPayload = {
        motivoModificacion: motivoModificacionCompleto,
        subeventos: subeventosAEnviar,
      };
      await apiRequest(`eventos/${idEvento}/logistica`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      const detalleActualizado = await obtenerDetalleActualizado();
      await sincronizarEstadoDetalle(detalleActualizado);
      setMensaje(
        "La solicitud de modificación logística fue enviada a revisión de Subdirección.",
      );
    } catch (errorOperacion) {
      setError(obtenerMensajeError(errorOperacion));
    } finally {
      setGuardando(false);
    }
  }

  function manejarEnvio(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void guardarCambiosLogistica();
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
        onClick={
          logisticaModificada || informacionGeneralModificada
            ? () => setMostrarModalRegreso(true)
            : () => navigate(rutaAdministracion)
        }>
        <ArrowLeft size={20} aria-hidden="true" />
        <span>Volver</span>
      </button>

      {mostrarModalRegreso && (
        <Modal
          mostrarModal={mostrarModalRegreso}
          titulo="Advertencia"
          contenido="¿Estás seguro que deseas regresar? Los cambios realizados se perderán"
          cerrarModal={() => setMostrarModal(false)}>
          <div className="flex gap-3 justify-end">
            <Button
              text="Cancelar"
              variant="secondary"
              type="button"
              onClick={() => setMostrarModalRegreso(false)}
            />
            <Button
              text="Aceptar"
              variant="success"
              type="button"
              onClick={() =>
                navigate(rutaAdministracion)
              }
            />
          </div>
        </Modal>
      )}

      <div id="contenedorTituloBanner" className="space-y-4 sm:space-y-5">
        <h1 className="font-merriweather text-2xl font-semibold leading-tight sm:text-3xl lg:text-4xl">
          {idSubEventoSeleccionado !== undefined
            ? "Modificar detalles de la actividad"
            : "Modificar detalles del evento"}
        </h1>
        {evento?.posterUrl && (
          <EventBanner eventName={evento.nombre} posterUrl={evento.posterUrl} />
        )}
      </div>

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

      {evento && (
        <>
          {evento.solicitudModificacionPendiente && (
            <div
              role="status"
              className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900 shadow-sm">
              <p className="font-semibold">
                Solicitud de modificación logística en revisión
              </p>
              <p className="mt-1 text-sm whitespace-pre-wrap">
                <span className="font-medium">Motivo actual enviado:</span>{" "}
                {separarMotivoUrgencia(
                  evento.solicitudModificacionPendiente.motivoModificacion,
                ).motivoModificacion || "Sin motivo especificado"}
              </p>
              <p className="mt-2 text-xs text-amber-800">
                Cualquier nuevo cambio logístico que envíes actualizará esta
                misma solicitud en curso sin generar solicitudes duplicadas.
              </p>
            </div>
          )}

          <form onSubmit={manejarEnvio} className="space-y-10">
            <fieldset disabled={guardando} className="space-y-10 border-0 p-0">
              <div
                id="contenedorDatosIniciales"
                className="space-y-6 rounded-lg border border-gray-200 bg-white p-6 shadow-md">
                <div className="border-b border-gray-100 pb-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
                      {idSubEventoSeleccionado !== undefined
                        ? "Datos generales de la actividad"
                        : "Información general del evento"}
                    </h2>
                    <Badge variant="success">Aplicación inmediata</Badge>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">
                    Estos cambios se guardan y reflejan de inmediato sin
                    requerir evaluación de Subdirección.
                  </p>
                </div>

                {idSubEventoSeleccionado === undefined && (
                  <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
                    <div className="w-fit">
                      <FormField
                        className="!font-bold !text-black"
                        label="Banner del evento"
                        mensajeAyuda="Resolución: 2048 x 1152">
                        <InputFile
                          key={
                            archivoPoster?.name ?? evento.posterUrl ?? "poster"
                          }
                          id="campoPoster"
                          accept=".jpg"
                          disabled={guardando}
                          onChange={(event) =>
                            setArchivoPoster(
                              event.currentTarget.files?.[0] ?? null,
                            )
                          }
                        />
                      </FormField>
                    </div>
                    <div className="max-w-xs">
                      <FormField
                        label="Alcance"
                        htmlFor="campoAlcance"
                        className="!font-bold !text-black">
                        <Select
                          id="campoAlcance"
                          placeholder="Selecciona una opción"
                          options={ALCANCES}
                          value={alcance === "" ? "" : String(alcance)}
                          disabled={guardando}
                          onChange={(event) => {
                            const valor = Number(event.currentTarget.value);
                            if (
                              valor === AlcanceEvento.PUBLICO ||
                              valor === AlcanceEvento.INTERNO ||
                              valor === AlcanceEvento.PRIVADO
                            ) {
                              setAlcance(valor);
                            }
                          }}
                        />
                      </FormField>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="relative">
                    <label
                      htmlFor="campoNombre"
                      className="block text-sm font-bold text-black">
                      {idSubEventoSeleccionado !== undefined
                        ? "Nombre de la actividad"
                        : "Nombre del evento"}
                    </label>
                    <span className="text-xs text-gray-500">
                      Máximo 150 caracteres
                    </span>
                    <div className="relative mt-1">
                      <Pencil
                        size={18}
                        aria-hidden="true"
                        className="absolute right-3 top-4 text-gray-500"
                      />
                      <FormField
                        errorMessage={
                          !nombre.trim() ? "El nombre es obligatorio" : ""
                        }>
                        <Input
                          id="campoNombre"
                          className="pr-10 font-merriweather text-xl font-bold text-secondary sm:text-2xl"
                          value={nombre}
                          hasError={intentoGuardar && !nombre.trim()}
                          aria-errormessage="El nombre es obligatorio"
                          maxLength={150}
                          onChange={(event) =>
                            setNombre(event.currentTarget.value)
                          }
                        />
                      </FormField>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="campoDescripcion"
                      className="block text-sm font-bold text-black">
                      {idSubEventoSeleccionado !== undefined
                        ? "Descripción de la actividad"
                        : "Descripción del evento"}
                    </label>
                    <span className="text-xs text-gray-500">
                      Máximo 500 caracteres
                    </span>
                    <div className="relative mt-1">
                      <Pencil
                        size={18}
                        aria-hidden="true"
                        className="absolute right-3 top-4 text-gray-500"
                      />
                      <FormField
                        errorMessage={
                          !descripcion.trim()
                            ? "La descripción es obligatoria"
                            : ""
                        }>
                        <TextArea
                          id="campoDescripcion"
                          value={descripcion}
                          maxLength={500}
                          hasError={intentoGuardar && !descripcion.trim()}
                          onChange={(event) =>
                            setDescripcion(event.currentTarget.value)
                          }
                          className="resize-none"
                        />
                      </FormField>
                    </div>
                  </div>

                  {idSubEventoSeleccionado === undefined && (
                    <div>
                      <label
                        htmlFor="campoJustificacion"
                        className="block text-sm font-bold text-black">
                        Beneficio politécnico
                      </label>
                      <span className="text-xs text-gray-500">
                        Máximo 500 caracteres
                      </span>
                      <div className="relative mt-1">
                        <Pencil
                          size={18}
                          aria-hidden="true"
                          className="absolute right-3 top-4 text-gray-500"
                        />
                        <FormField
                          className="!font-bold !text-black"
                          errorMessage={
                            !justificacion.trim()
                              ? "La justificación debe ser obligatoria"
                              : justificacion.trim().length >= 500
                                ? "La justificación no puede exceder los 500 caracteres"
                                : ""
                          }>
                          <TextArea
                            id="campoJustificacion"
                            value={justificacion}
                            maxLength={500}
                            disabled={guardando}
                            hasError={
                              !justificacion.trim() ||
                              justificacion.trim().length >= 500
                            }
                            onChange={(event) =>
                              setJustificacion(event.currentTarget.value)
                            }
                            className="h-30 resize-none pr-10"
                          />
                        </FormField>
                      </div>
                    </div>
                  )}
                </div>

                <div
                  className={`grid min-w-0 grid-cols-1 items-start gap-8 pt-2 ${
                    idSubEventoSeleccionado === undefined
                      ? "lg:grid-cols-2"
                      : ""
                  }`}>
                  <div id="contenedorPonentes" className="space-y-4">
                    <h3 className="text-lg font-bold">
                      {idSubEventoSeleccionado !== undefined
                        ? "Ponentes de la actividad"
                        : "Ponentes"}
                    </h3>
                    {ponentes.length > 0 ? (
                      <div className="w-full min-w-0 overflow-x-auto rounded-md border border-gray-200 shadow-sm">
                        <Table
                          columnas={columnasPonente}
                          filas={ponentes}
                          obtenerClave={(ponente) => ponente.id}
                          className="table-auto min-w-full bg-white text-left text-sm [&_tbody_tr]:h-12 [&_thead_tr]:h-10 [&_th]:py-2 [&_td]:py-2"
                        />
                      </div>
                    ) : (
                      <p className="text-gray-600">
                        No hay ponentes registrados.
                      </p>
                    )}
                    <Button
                      text="Agregar ponente"
                      variant="primary"
                      type="button"
                    />
                  </div>

                  {idSubEventoSeleccionado === undefined && (
                    <div id="contenedorLogistica" className="space-y-4">
                      <h3 className="text-lg font-bold">
                        Personal de logística del evento
                      </h3>
                      {personalLogistica.length > 0 ? (
                        <div className="w-full min-w-0 overflow-x-auto rounded-md border border-gray-200 shadow-sm">
                          <Table
                            columnas={columnasLogistica}
                            filas={personalLogistica}
                            obtenerClave={(personal) => personal.idUsuario}
                            className="table-auto min-w-full bg-white text-left text-sm [&_tbody_tr]:h-12 [&_thead_tr]:h-10 [&_th]:py-2 [&_td]:py-2"
                          />
                        </div>
                      ) : (
                        <p className="text-gray-600">
                          No hay personal de logística registrado para este
                          evento.
                        </p>
                      )}
                      <Button
                        text="Agregar personal de logística"
                        variant="primary"
                        type="button"
                      />
                    </div>
                  )}
                </div>

                <div className="flex justify-end border-t border-gray-100 pt-4">
                  <Button
                    text={
                      idSubEventoSeleccionado !== undefined
                        ? "Guardar datos de la actividad"
                        : "Guardar información general"
                    }
                    type="button"
                    loading={guardando}
                    onClick={() => void guardarInformacionGeneral()}
                  />
                </div>
              </div>

              <div className="space-y-6 rounded-lg border border-gray-200 bg-white p-6 shadow-md">
                <div className="border-b border-gray-100 pb-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
                      Logística y espacio
                    </h2>
                    <Badge variant="warning">
                      Requiere aprobación de Subdirección
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">
                    Modificar el recinto, la fecha, el horario o la modalidad de
                    acceso generará (o actualizará si ya existe una en curso)
                    una única solicitud de modificación para revisión de
                    Subdirección.
                  </p>
                </div>

                <EditLogisticsSection
                  valores={logistica}
                  recintos={recintos}
                  recintoActual={recintoActual}
                  errorRecintos={errorRecintos}
                  agendaOcupada={agendaOcupada}
                  cargandoAgenda={cargandoAgenda}
                  errorAgenda={errorAgenda}
                  deshabilitado={guardando}
                  onCambioLogistica={cambiarLogistica}
                />

                <div className="flex justify-end border-t border-gray-100 pt-4">
                  <Button
                    text={
                      evento.solicitudModificacionPendiente
                        ? "Actualizar solicitud en curso"
                        : "Solicitar cambio logístico"
                    }
                    type="submit"
                    loading={guardando}
                  />
                </div>
              </div>
            </fieldset>
            {(mostrarModal || mostrarModalAviso) && (
              <ModalMotivo
                mostrarModal={mostrarModal}
                mostrarModalAviso={mostrarModalAviso}
                intentoMotivo={intentoMotivo}
                esUrgente={esModificacionUrgente}
                logistica={logistica}
                onCerrar={() => setMostrarModal(false)}
                onCerrarAviso={() => {
                  setMostrarModalAviso(false);
                  if (esModificacionUrgente) {
                    setMostrarModalUrgente(true);
                  } else {
                    setMostrarModal(true);
                  }
                }}
                onCambioMotivo={(motivo) =>
                  cambiarLogistica("motivoModificacion", motivo)
                }
                onSolicitarConfirmacion={solicitarConfirmacionLogistica}
                onConfirmar={confirmarEnvioLogistica}
              />
            )}
            <ModalMotivoUrgente
              mostrar={mostrarModalUrgente}
              motivo={motivoUrgente}
              maxLength={500}
              contenido="La fecha propuesta está dentro de los próximos 7 días. Explica por qué la modificación se solicita con carácter urgente."
              cerrar={() => {
                setMostrarModalUrgente(false);
                setMostrarModal(true);
              }}
              onMotivoChange={setMotivoUrgente}
              continuar={() => {
                setMostrarModalUrgente(false);
                setMostrarModalAviso(true);
              }}
            />
          </form>
        </>
      )}
    </section>
  );
}
