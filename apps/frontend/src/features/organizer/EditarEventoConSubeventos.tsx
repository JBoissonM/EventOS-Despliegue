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
  type Recinto,
  type SubEventoLogisticaPayload,
} from "@eventos/shared";
import { ArrowLeft } from "lucide-react";
import { EventBanner } from "../event-details/components/molecules/EventBanner";
import { Input } from "../../components/atoms/Input/Input";
import { InputFile } from "../../components/atoms/InputFile/InputFile";
import { Select } from "../../components/atoms/Select/Select";
import { TextArea } from "../../components/atoms/TextArea/TextArea";
import Button from "../../components/atoms/Button/Button";
import { FormField } from "../../components/molecules/FormField";
import { Modal } from "../../components/molecules/Modal";
import { apiRequest } from "../../lib/apiClient";
import {
  OrganizerSubeventCard,
  type OrganizerSubeventCardData,
} from "./components/OrganizerSubeventCard";

import { Pencil } from "lucide-react";
import { Badge } from "../../components/atoms/Badge/Badge";

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

const opcionesAlcance = [
  { value: String(AlcanceEvento.PUBLICO), label: "Público" },
  { value: String(AlcanceEvento.INTERNO), label: "Interno" },
  { value: String(AlcanceEvento.PRIVADO), label: "Privado" },
];

const opcionesAcceso = [
  { value: "true", label: "Boleto con QR" },
  { value: "false", label: "Acceso libre" },
];

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
      datosGenerales.justificacion !== datosGeneralesIniciales.justificacion ||
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
    setActividades((actuales) => [
      ...actuales,
      {
        llave: `nuevo-${crypto.randomUUID()}`,
        nombre: "",
        descripcion: "",
        idRecinto: "",
        fecha: "",
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
    if (
      actividades.some(
        (actividad) =>
          !actividad.nombre.trim() ||
          actividad.nombre.trim().length > 150 ||
          !actividad.descripcion.trim() ||
          actividad.descripcion.trim().length > 500,
      )
    ) {
      return "Cada actividad debe tener un nombre y una descripción de hasta 500 caracteres.";
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

      {datosGenerales && (
        <form
          data-editar-evento-subeventos
          onSubmit={guardarCambios}
          className="space-y-8">
          <fieldset disabled={guardando} className="space-y-8 border-0 p-0">
            <section className="space-y-4 border border-gray-200 bg-white p-5 shadow-md">
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
                        ? "La descripciòn no puede exceder los 500 caracteres"
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
    </section>
  );
}
