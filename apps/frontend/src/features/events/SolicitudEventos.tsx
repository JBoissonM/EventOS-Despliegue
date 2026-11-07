import { SeccionDatosEvento } from "../../components/organisms/SolicitudEventos/SeccionDatosEvento";
import { useEffect, useState, type FormEvent } from "react";
import { SeccionSubeventos } from "../../components/organisms/SolicitudEventos/SeccionSubeventos";
import Button from "../../components/atoms/Button/Button";
import { useNavigate } from "react-router";
import { Modal } from "../../components/molecules/Modal";
import { RecintoId, type SubeventoPayload } from "@eventos/shared";
import { ModalMotivoUrgente } from "../../components/organisms/ModalMotivoUrgente/ModalMotivoUrgente";
import { apiRequest } from "../../lib/apiClient";

import { ArrowLeft } from "lucide-react";

export type SubeventoFormData = SubeventoPayload & { id: number };

export interface FormularioSolicitudData {
  nombre: string;
  idAlcance: string;
  justificacion: string;
  descripcion: string;
  rutaPoster: File | null;
  subEventos: SubeventoFormData[];
}

interface EstadoPerfilVerificacion {
  cuenta?: string;
  verificacionVigente?: boolean;
}

export type CampoFormulario = Exclude<
  keyof FormularioSolicitudData,
  "subEventos"
>;
export type CampoTextoFormulario = Exclude<CampoFormulario, "rutaPoster">;

export type ErroresFormulario = Partial<Record<CampoFormulario, string>>;
export type mensajesAyuda = Partial<Record<CampoFormulario, string>>;
export type CamposTocados = Partial<Record<CampoFormulario, boolean>>;
export type CampoSubevento = Exclude<keyof SubeventoFormData, "id">;
export type ErroresSubevento = Partial<Record<CampoSubevento, string>>;
export type CamposSubeventoTocados = Partial<Record<CampoSubevento, boolean>>;

export interface PropsValidacionFormulario {
  errores: ErroresFormulario;
  touched: CamposTocados;
  esTocado: (field: CampoFormulario) => void;
}

export interface PropsSubeventosFormulario {
  subEventos: SubeventoFormData[];
  erroresSubeventos: ErroresSubevento[];
  subeventoTocado: CamposSubeventoTocados[];
  updateSubevento: (
    index: number,
    field: CampoSubevento,
    value: string,
  ) => void;
  markSubeventoTouched: (index: number, field: CampoSubevento) => void;
  addSubevento: () => void;
  removeSubevento: (index: number) => void;
}

let siguienteIdSubevento = 0;
const MAX_SUBEVENTOS = 10;

const crearSubevento = (): SubeventoFormData => ({
  id: siguienteIdSubevento++,
  nombre: "",
  descripcion: "",
  idRecinto: 0,
  fecha: "",
  horaInicio: "",
  horaFin: "",
});

function validarFormulario(form: FormularioSolicitudData): ErroresFormulario {
  const errors: ErroresFormulario = {};
  const regex = /[a-zA-Z0-9,:;¡!¿?'"()&+-/#]/;

  if (!form.nombre.trim()) {
    errors.nombre = "El nombre del evento es obligatorio.";
  } else if (form.nombre.trim().length > 150) {
    errors.nombre = "El nombre del evento no debe exceder los 150 caracteres";
  }

  if (!form.idAlcance) {
    errors.idAlcance =
      "Debe seleccionar un tipo de alcance válido para continuar";
  }

  if (!form.rutaPoster) {
    errors.rutaPoster = "El póster del evento es obligatorio.";
  } else if (form.rutaPoster.size > 5 * 1024 * 1024) {
    errors.rutaPoster = "El póster no debe exceder los 5 megabytes.";
  }

  if (!form.descripcion.trim()) {
    errors.descripcion = "La descripción del evento es obligatoria.";
  } else if (form.descripcion.trim().length > 500) {
    errors.descripcion = "La descripcion no debe exceder los 500 caracteres";
  }

  if (!form.justificacion.trim()) {
    errors.justificacion = "La justificación del evento es obligatoria.";
  } else if (form.justificacion.trim().length > 500) {
    errors.justificacion =
      "La justificacion no debe exceder los 500 caracteres";
  } else if (!regex.test(form.justificacion)) {
    errors.justificacion = "Simbolo no valido";
  }

  return errors;
}

function diferenciaFechas(fechaSeleccionada: string): number | null {
  if (!fechaSeleccionada) return null;
  const [anio, mes, dia] = fechaSeleccionada.split("-").map(Number);
  const fecha = new Date(anio, mes - 1, dia);
  const hoy = new Date();
  const fechaSeleccionadaUTC = Date.UTC(anio, mes - 1, dia);
  const hoyUTC = Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  return (fechaSeleccionadaUTC - hoyUTC) / 86_400_000;
}

function validarSubeventos(
  subEventos: SubeventoFormData[],
): ErroresSubevento[] {
  return subEventos.map((subevento, index) => {
    const errors: ErroresSubevento = {};

    if (subEventos.length > 1) {
      if (!subevento.nombre.trim()) {
        errors.nombre = "El nombre del subevento es obligatorio";
      } else if (subevento.nombre.trim().length > 150) {
        errors.nombre =
          "El nombre del subevento no debe exceder los 150 caracteres";
      }
      if (!subevento.descripcion.trim()) {
        errors.descripcion = "La descripción del subevento es obligatoria";
      } else if (subevento.descripcion.trim().length > 500) {
        errors.descripcion =
          "La descripción del subevento no debe exceder los 500 caracteres";
      }
    }

    if (!subevento.fecha) {
      errors.fecha = "Selecciona la fecha del evento";
    }

    if (!subevento.horaInicio) {
      errors.horaInicio = "Selecciona la hora de inicio";
    }

    if (!subevento.horaFin) {
      errors.horaFin = "Selecciona la hora final";
    }

    if (!subevento.idRecinto) {
      errors.idRecinto = "Selecciona un espacio para el evento";
    }

    if (
      subevento.idRecinto &&
      subevento.idRecinto !== RecintoId.SALA_14 &&
      subevento.accesoQR === undefined
    ) {
      errors.accesoQR = "Indica si el evento requiere boleto";
    }

    if (
      subevento.horaInicio &&
      subevento.horaFin &&
      subevento.horaInicio >= subevento.horaFin
    ) {
      errors.horaFin = "La hora final debe ser posterior a la hora de inicio";
    }

    const hayTraslape = subEventos.some((otro, otroIndex) => {
      if (
        otroIndex === index ||
        otro.fecha !== subevento.fecha ||
        otro.idRecinto !== subevento.idRecinto ||
        !otro.horaInicio ||
        !otro.horaFin ||
        !subevento.horaInicio ||
        !subevento.horaFin
      ) {
        return false;
      }

      return (
        subevento.horaInicio < otro.horaFin &&
        otro.horaInicio < subevento.horaFin
      );
    });

    if (hayTraslape) {
      errors.horaInicio =
        "Ese horario ya está ocupado para este recinto y fecha.";
    }

    return errors;
  });
}

export function SolicitudEvento() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormularioSolicitudData>({
    nombre: "",
    idAlcance: "",
    justificacion: "",
    descripcion: "",
    rutaPoster: null,
    subEventos: [crearSubevento()],
  });

  const volverAlMenu = () => {
  const usuario = JSON.parse(localStorage.getItem("usuario") ?? "{}");
  const tipoCuenta = String(usuario.tipoCuenta ?? "").toLowerCase();

  navigate(
    tipoCuenta.includes("subdirección") || tipoCuenta.includes("subdireccion")
      ? "/subdireccion/menu-principal"
      : "/organizador/mis-eventos",
  );
};

  const [touched, setTouched] = useState<CamposTocados>({});
  const [subeventTouched, setSubeventTouched] = useState<
    CamposSubeventoTocados[]
  >([{}]);

  const [modal, setModal] = useState<"confirmacion" | "error" | "exito" | null>(
    null,
  );

  const [mensajeError, setMensajeError] = useState("");
  const [modalUrgente, setModalUrgente] = useState(false);
  const [motivoUrgente, setMotivoUrgente] = useState("");
  const [estadoVerificacion, setEstadoVerificacion] = useState<
    "cargando" | "verificado" | "requerida" | "error"
  >("cargando");
  const [errorVerificacion, setErrorVerificacion] = useState("");
  const errors = validarFormulario(form);
  const subeventErrors = validarSubeventos(form.subEventos);

  useEffect(() => {
    const controller = new AbortController();
    const verificarCuenta = async () => {
      if (!localStorage.getItem("token")) {
        setErrorVerificacion("No hay una sesión iniciada.");
        setEstadoVerificacion("error");
        return;
      }

      try {
        const perfil = await apiRequest<EstadoPerfilVerificacion>(
          "usuarios/perfil",
          { signal: controller.signal },
        );
        if (controller.signal.aborted) return;

        const verificado =
          perfil.cuenta === "Verificado" || perfil.verificacionVigente === true;
        setEstadoVerificacion(verificado ? "verificado" : "requerida");
      } catch (error) {
        if (controller.signal.aborted) return;
        setErrorVerificacion(
          error instanceof Error
            ? error.message
            : "No se pudo consultar el estado de verificación.",
        );
        setEstadoVerificacion("error");
      }
    };

    void verificarCuenta();
    return () => controller.abort();
  }, []);

  const updateField = (field: CampoTextoFormulario, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const updatePoster = (poster: File | null) =>
    setForm((prev) => ({ ...prev, rutaPoster: poster }));

  const updateSubevento = (
    index: number,
    field: CampoSubevento,
    value: string,
  ) => {
    setForm((prev) => ({
      ...prev,
      subEventos: prev.subEventos.map((subevento, currentIndex) => {
        if (currentIndex !== index) return subevento;

        if (field === "fecha") {
          return {
            ...subevento,
            fecha: value,
            horaInicio: "",
            horaFin: "",
          };
        }

        if (field === "horaInicio") {
          return {
            ...subevento,
            horaInicio: value,
            horaFin: "",
          };
        }

        if (field === "idRecinto") {
          const idRecinto = Number(value);
          const updated: SubeventoFormData = {
            ...subevento,
            idRecinto,
          };
          if (idRecinto !== subevento.idRecinto) {
            updated.horaInicio = "";
            updated.horaFin = "";
          }
          if (
            idRecinto === RecintoId.LABORATORIO_A ||
            idRecinto === RecintoId.LABORATORIO_B
          ) {
            updated.accesoQR = true;
          } else if (idRecinto === RecintoId.SALA_14) {
            updated.accesoQR = false;
          } else {
            updated.accesoQR = undefined;
          }
          return updated;
        }

        if (field === "accesoQR") {
          return { ...subevento, accesoQR: value === "true" };
        }

        return { ...subevento, [field]: value };
      }),
    }));
  };

  const markTouched = (field: CampoFormulario) =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  const markSubeventoTouched = (index: number, field: CampoSubevento) => {
    setSubeventTouched((prev) =>
      prev.map((fields, currentIndex) =>
        currentIndex === index ? { ...fields, [field]: true } : fields,
      ),
    );
  };

  const addSubevento = () => {
    if (form.subEventos.length >= MAX_SUBEVENTOS) return;

    setForm((prev) => ({
      ...prev,
      subEventos:
        prev.subEventos.length >= MAX_SUBEVENTOS
          ? prev.subEventos
          : [...prev.subEventos, crearSubevento()],
    }));
    setSubeventTouched((prev) =>
      prev.length >= MAX_SUBEVENTOS ? prev : [...prev, {}],
    );
  };

  const removeSubevento = (index: number) => {
    setForm((prev) => ({
      ...prev,
      subEventos: prev.subEventos.filter(
        (_, currentIndex) => currentIndex !== index,
      ),
    }));
    setSubeventTouched((prev) =>
      prev.filter((_, currentIndex) => currentIndex !== index),
    );
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (estadoVerificacion !== "verificado") {
      setEstadoVerificacion("requerida");
      return;
    }
    setMensajeError("");
    setTouched({
      nombre: true,
      idAlcance: true,
      rutaPoster: true,
      descripcion: true,
      justificacion: true,
    });
    setSubeventTouched(
      form.subEventos.map(() => ({
        fecha: true,
        horaInicio: true,
        horaFin: true,
        idRecinto: true,
        accesoQR: true,
      })),
    );

    const hayErrores =
      Object.keys(errors).length > 0 ||
      subeventErrors.some((errores) => Object.keys(errores).length > 0);

    if (hayErrores) {
      setModal("error");
      return;
    }

    const hayFechaUrgente = form.subEventos.some((subevento) => {
      const dias = diferenciaFechas(subevento.fecha);
      return dias !== null && dias >= 0 && dias < 7;
    });

    if (hayFechaUrgente) {
      setModalUrgente(true);
      return;
    }

    setModal("confirmacion");
  };

  const confirmarModal = async () => {
    if (estadoVerificacion !== "verificado") {
      setEstadoVerificacion("requerida");
      setModal(null);
      return;
    }

    setMensajeError("");
    setModal(null);

    const datos = new FormData();

    datos.append("nombre", form.nombre.trim());
    datos.append("descripcion", form.descripcion.trim());
    datos.append("justificacion", form.justificacion.trim());
    datos.append("idAlcance", form.idAlcance);
    if (motivoUrgente.trim()) {
      datos.append("motivoUrgencia", motivoUrgente.trim());
    }
    datos.append(
      "subeventos",
      JSON.stringify(
        form.subEventos.map(
          (subevento): SubeventoPayload => ({
            nombre:
              form.subEventos.length === 1
                ? form.nombre.trim()
                : subevento.nombre.trim(),
            descripcion:
              form.subEventos.length === 1
                ? form.descripcion.trim()
                : subevento.descripcion.trim(),
            idRecinto: subevento.idRecinto,
            fecha: subevento.fecha,
            horaInicio: subevento.horaInicio,
            horaFin: subevento.horaFin,
            accesoQR:
              subevento.idRecinto !== RecintoId.SALA_14 &&
              subevento.accesoQR === true,
          }),
        ),
      ),
    );

    if (form.rutaPoster) {
      datos.append("poster", form.rutaPoster);
    }

    const token = localStorage.getItem("token");

    const response = await fetch("http://localhost:3000/api/solicitudes", {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: datos,
    });

    if (!response.ok) {
      const data = await response.json();
      setMensajeError(
        typeof data.message === "string"
          ? data.message
          : "No se pudo enviar la solicitud.",
      );
      setModal("error");
      return;
    }

    setForm({
      nombre: "",
      idAlcance: "",
      justificacion: "",
      descripcion: "",
      rutaPoster: null,
      subEventos: [crearSubevento()],
    });
    setTouched({});
    setSubeventTouched([{}]);
    setMotivoUrgente("");
    setMensajeError("");
    setModal("exito");
  };

  if (estadoVerificacion === "cargando") {
    return (
      <p role="status" className="mx-auto w-full max-w-8xl px-4 py-8">
        Verificando el estado de tu cuenta...
      </p>
    );
  }

  return (
    <section className="mx-auto w-full max-w-8xl space-y-6 px-4 sm:px-6 lg:px-8">
      <div
        id="contenedorReturn"
        className="flex gap-2 cursor-pointer"
        onClick={volverAlMenu}>
        <ArrowLeft size={20}></ArrowLeft>
        <span>Volver</span>
      </div>
      <h1 className="font-merriweather text-2xl font-bold sm:text-[36px]">
        Solicitud de evento
      </h1>
      {estadoVerificacion === "verificado" && (
        <form onSubmit={handleSubmit} className="space-y-7">
          <SeccionDatosEvento
            form={form}
            actualizarCampo={updateField}
            actualizarPoster={updatePoster}
            errores={errors}
            touched={touched}
            esTocado={markTouched}
          />
          <SeccionSubeventos
            subEventos={form.subEventos}
            erroresSubeventos={subeventErrors}
            subeventoTocado={subeventTouched}
            updateSubevento={updateSubevento}
            markSubeventoTouched={markSubeventoTouched}
            addSubevento={addSubevento}
            removeSubevento={removeSubevento}
          />
          <div className="flex sm:justify-start">
            <Button
              text="Solicitar evento"
              type="submit"
              className="w-full sm:w-auto"
            />
          </div>

          <Modal
            titulo={
              modal === "error"
                ? `Error`
                : modal === "exito"
                  ? `Operación exitosa`
                  : `Confirmar solicitud`
            }
            contenido={
              modal === "error"
                ? mensajeError ||
                  "Por favor, completa todos los campos obligatorios resaltados para continuar"
                : modal === "exito"
                  ? "La solicitud se ha procesado éxitosamente y será evaluada por Subdirección de Servicios Académicos"
                  : "¿Desea enviar la solicitud de este evento?"
            }
            mostrarModal={modal !== null}
            cerrarModal={() => setModal(null)}>
            <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
              {modal === "error" || modal === "exito" ? (
                <Button
                  text="Aceptar"
                  onClick={() => setModal(null)}
                  className="w-full sm:w-auto"
                />
              ) : (
                <>
                  <Button
                    text="Cancelar"
                    variant="danger"
                    onClick={() => setModal(null)}
                    className="w-full sm:w-auto"
                  />
                  <Button
                    text="Aceptar"
                    variant="success"
                    onClick={confirmarModal}
                    className="w-full sm:w-auto"
                  />
                </>
              )}
            </div>
          </Modal>

          {modalUrgente && (
            <ModalMotivoUrgente
              mostrar={modalUrgente}
              motivo={motivoUrgente}
              onMotivoChange={setMotivoUrgente}
              cerrar={() => setModalUrgente(false)}
              continuar={() => {
                setModalUrgente(false);
                setModal("confirmacion");
              }}
            />
          )}
        </form>
      )}
      <Modal
        titulo={
          estadoVerificacion === "requerida"
            ? "Verificación necesaria"
            : "No se pudo verificar tu cuenta"
        }
        contenido={
          estadoVerificacion === "requerida"
            ? "Necesitas tener tu cuenta verificada para solicitar un evento. Verifica tu identidad para continuar."
            : errorVerificacion
        }
        mostrarModal={
          estadoVerificacion === "requerida" || estadoVerificacion === "error"
        }
        cerrarModal={() => navigate("/perfil")}>
        <div className="flex justify-end gap-3">
          <Button
            text="Ir a mi perfil"
            variant="secondary"
            type="button"
            onClick={() => navigate("/perfil")}
          />
          {estadoVerificacion === "requerida" && (
            <Button
              text="Ir a verificación"
              type="button"
              onClick={() => navigate("/verificacion")}
            />
          )}
        </div>
      </Modal>
    </section>
  );
}
