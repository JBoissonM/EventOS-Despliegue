import { useEffect, useState } from "react";
import type { ActualizarEnlaceInvitacionPayload } from "@eventos/shared";
import { Check, Copy, Link2, RefreshCw } from "lucide-react";
import { apiRequest } from "../../../lib/apiClient";
import { Badge } from "../../../components/atoms/Badge/Badge";
import Button from "../../../components/atoms/Button/Button";
import { InfoTooltip } from "../../../components/atoms/InfoTooltip/InfoTooltip";
import { FeedbackNotice } from "../../../components/molecules/FeedbackNotice";
import { Modal } from "../../../components/molecules/Modal";

interface RespuestaEnlaceInvitacion {
  mensaje: string;
  idSubEvento: number;
  tokenInvitacion: string;
  enlaceInvitacionActivo: boolean;
}

interface EnlaceInvitacionSubeventoProps {
  idEvento: number | string;
  idSubEvento: number;
  tokenInvitacion?: string;
  enlaceInvitacionActivo?: boolean;
  disabled?: boolean;
  onActualizado?: (datos: {
    idSubEvento: number;
    tokenInvitacion: string;
    enlaceInvitacionActivo: boolean;
  }) => void;
}

export function EnlaceInvitacionSubevento({
  idEvento,
  idSubEvento,
  tokenInvitacion,
  enlaceInvitacionActivo = false,
  disabled = false,
  onActualizado,
}: EnlaceInvitacionSubeventoProps) {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [activo, setActivo] = useState(enlaceInvitacionActivo);
  const [token, setToken] = useState(tokenInvitacion ?? "");
  const [cargandoSwitch, setCargandoSwitch] = useState(false);
  const [regenerando, setRegenerando] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setActivo(enlaceInvitacionActivo);
  }, [enlaceInvitacionActivo]);

  useEffect(() => {
    setToken(tokenInvitacion ?? "");
  }, [tokenInvitacion]);

  const urlCompartible = token
    ? `${window.location.origin}/eventos/privado/${token}`
    : "";

  async function handleToggleEnlace() {
    if (disabled || cargandoSwitch || regenerando) return;
    setError(null);
    setCargandoSwitch(true);
    const nuevoEstado = !activo;
    try {
      const payload: ActualizarEnlaceInvitacionPayload = {
        activo: nuevoEstado,
      };
      const res = await apiRequest<RespuestaEnlaceInvitacion>(
        `eventos/${idEvento}/subeventos/${idSubEvento}/enlace-invitacion`,
        {
          method: "PATCH",
          body: JSON.stringify(payload),
        },
      );
      setActivo(res.enlaceInvitacionActivo);
      if (res.tokenInvitacion) {
        setToken(res.tokenInvitacion);
      }
      onActualizado?.({
        idSubEvento: res.idSubEvento ?? idSubEvento,
        tokenInvitacion: res.tokenInvitacion ?? token,
        enlaceInvitacionActivo: res.enlaceInvitacionActivo,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo actualizar el estado del enlace.",
      );
    } finally {
      setCargandoSwitch(false);
    }
  }

  async function handleRegenerar() {
    if (disabled || cargandoSwitch || regenerando) return;
    setError(null);
    setRegenerando(true);
    try {
      const res = await apiRequest<RespuestaEnlaceInvitacion>(
        `eventos/${idEvento}/subeventos/${idSubEvento}/enlace-invitacion/regenerar`,
        { method: "POST" },
      );
      setToken(res.tokenInvitacion);
      setActivo(res.enlaceInvitacionActivo);
      setCopiado(false);
      onActualizado?.({
        idSubEvento: res.idSubEvento ?? idSubEvento,
        tokenInvitacion: res.tokenInvitacion,
        enlaceInvitacionActivo: res.enlaceInvitacionActivo,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo regenerar el enlace de invitación.",
      );
    } finally {
      setRegenerando(false);
    }
  }

  async function handleCopiar() {
    if (!activo || !urlCompartible) return;
    setError(null);
    try {
      await navigator.clipboard.writeText(urlCompartible);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2000);
    } catch {
      setError("No se pudo copiar el enlace al portapapeles.");
    }
  }

  const ocupado = disabled || cargandoSwitch || regenerando;

  return (
    <>
      <Button
        type="button"
        variant="primary"
        disabled={disabled}
        text="Invitación por enlace"
        /*         icon={<Link2 size={16} aria-hidden="true" />}
         */ onClick={() => {
          setError(null);
          setModalAbierto(true);
        }}
      />

      {modalAbierto && (
        <Modal
          mostrarModal={modalAbierto}
          titulo="Invitación por enlace"
          contenido={
            "Comparte este enlace para que tus invitados puedan acceder a esta actividad privada"
          }
          cerrarModal={() => setModalAbierto(false)}
        >
          <div className="space-y-4 ">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-eventos-surface">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-merriweather">
                  Estado del enlace
                </span>
                <InfoTooltip
                  ariaLabel="Información sobre enlace compartible"
                  content="Si el enlace está activo, cualquier persona con la URL podrá ver la actividad y solicitar acceso mientras haya cupo. Si se filtra, puedes regenerarlo para invalidar el anterior."
                />
              </div>

              <label className="inline-flex cursor-pointer items-center gap-2.5 select-none">
                <span className="text-xs font-medium text-eventos-body-text">
                  {activo ? "Habilitado" : "Deshabilitado"}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={activo}
                  aria-label="Activar o desactivar enlace compartible"
                  disabled={ocupado}
                  onClick={() => void handleToggleEnlace()}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary disabled:cursor-not-allowed disabled:opacity-50 ${
                    activo ? "bg-eventos-success" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      activo ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </label>
            </div>

            {urlCompartible ? (
              <div className="space-y-4">
                <input
                  type="text"
                  readOnly
                  value={urlCompartible}
                  aria-label="URL compartible de invitación"
                  className={`w-full rounded-md border border-gray-300 px-3 py-2 text-xs sm:text-sm ${
                    activo
                      ? "bg-white text-eventos-ink"
                      : "bg-gray-100 text-gray-500"
                  }`}
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="primary"
                    disabled={!activo || ocupado}
                    onClick={() => void handleCopiar()}
                    text={copiado ? "Copiado" : "Copiar enlace"}
                    icon={
                      copiado ? (
                        <Check size={16} aria-hidden="true" />
                      ) : (
                        <Copy size={16} aria-hidden="true" />
                      )
                    }
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={ocupado}
                    onClick={() => void handleRegenerar()}
                    text={regenerando ? "Regenerando..." : "Regenerar enlace"}
                    icon={<RefreshCw size={16} aria-hidden="true" />}
                  />
                </div>
              </div>
            ) : (
              <p className="text-sm text-eventos-body-text">
                Activa el enlace para generar la URL compartible de esta
                actividad.
              </p>
            )}

            {error && (
              <FeedbackNotice
                variant="error"
                title="Error en enlace de invitación"
              >
                {error}
              </FeedbackNotice>
            )}

            <div className="flex justify-end border-t border-gray-200 pt-4">
              <Button
                type="button"
                variant="secondary"
                text="Cerrar"
                onClick={() => setModalAbierto(false)}
              />
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
