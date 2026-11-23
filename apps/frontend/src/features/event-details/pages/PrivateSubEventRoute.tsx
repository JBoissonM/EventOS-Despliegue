import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  obtenerEtiquetaModalidad,
  type DetalleSubEventoPrivadoResponse,
} from "@eventos/shared";
import { CalendarDays, Clock3, MapPin, UsersRound } from "lucide-react";
import { ApiError, apiRequest } from "../../../lib/apiClient";
import { Badge } from "../../../components/atoms/Badge/Badge";
import Button from "../../../components/atoms/Button/Button";
import { FeedbackNotice } from "../../../components/molecules/FeedbackNotice";
import { ModalidadAccesoHelp } from "../../../components/molecules/ModalidadAccesoHelp";
import { PageHeader } from "../../../components/organisms/PageHeader/PageHeader";
import { PageContainer } from "../../../components/templates/PageContainer";
import { EventBanner } from "../components/molecules/EventBanner";
import { EventDetailsRequestState } from "../components/molecules/EventDetailsRequestState";
import { SpeakersList } from "../components/molecules/SpeakersList";
import type { EventDetailsLoadStatus } from "../hooks/useEventDetails";
import { getAuthPathWithReturnUrl } from "../utils/eventReturnUrl";
import { formatEventDate } from "../utils/formatEventDate";

export function PrivateSubEventRoute() {
  const { tokenSubEvento } = useParams();
  const navigate = useNavigate();

  const tokenValido = Boolean(
    tokenSubEvento && /^[a-zA-Z0-9-]+$/.test(tokenSubEvento),
  );

  const [data, setData] = useState<DetalleSubEventoPrivadoResponse | null>(
    null,
  );
  const [status, setStatus] = useState<EventDetailsLoadStatus>(
    tokenValido ? "loading" : "invalid",
  );
  const [error, setError] = useState<string | null>(null);
  const [aceptando, setAceptando] = useState(false);
  const [errorAceptar, setErrorAceptar] = useState<string | null>(null);

  const cargarDetalle = useCallback(async () => {
    if (!tokenSubEvento || !tokenValido) {
      setStatus("invalid");
      setError("El enlace de invitación no es válido.");
      return;
    }

    setStatus("loading");
    setError(null);
    try {
      const res = await apiRequest<DetalleSubEventoPrivadoResponse>(
        `eventos/privado/${tokenSubEvento}`,
      );
      setData(res);
      setStatus("success");
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 403) {
          setStatus("forbidden");
          setError(err.message);
          return;
        }
        if (err.status === 404) {
          setStatus("not-found");
          setError(err.message);
          return;
        }
        setError(err.message);
      } else {
        setError(
          err instanceof Error
            ? err.message
            : "No fue posible cargar la invitación.",
        );
      }
      setStatus("error");
    }
  }, [tokenSubEvento, tokenValido]);

  useEffect(() => {
    void cargarDetalle();
  }, [cargarDetalle]);

  async function handleConfirmarAsistencia() {
    if (!data || !tokenSubEvento || aceptando) return;
    setErrorAceptar(null);
    setAceptando(true);
    try {
      if (!data.yaAutorizado) {
        await apiRequest(`eventos/privado/${tokenSubEvento}/aceptar`, {
          method: "POST",
        });
      }
      navigate(
        `/eventos/${data.idEvento}/actividades/${data.idSubEvento}/reservar`,
      );
    } catch (err) {
      setErrorAceptar(
        err instanceof Error
          ? err.message
          : "No se pudo confirmar tu acceso a la actividad.",
      );
    } finally {
      setAceptando(false);
    }
  }

  if (status !== "success" || !data) {
    return (
      <EventDetailsRequestState
        status={status === "success" ? "error" : status}
        error={error}
        onRetry={() => void cargarDetalle()}
      />
    );
  }

  const returnPath = `/eventos/privado/${tokenSubEvento}`;
  const loginPath = getAuthPathWithReturnUrl("/login", returnPath);
  const registerPath = getAuthPathWithReturnUrl("/registro", returnPath);

  const speakers = data.ponentes.map((p) => ({
    idPonente: p.idPonente,
    nombreCompleto: [p.nombre, p.apellidoPa, p.apellidoMa]
      .filter(Boolean)
      .join(" "),
  }));

  const datos = [
    {
      label: "Fecha",
      value: formatEventDate(data.fecha?.fecha),
      Icon: CalendarDays,
    },
    {
      label: "Espacio",
      value: data.recinto?.nombre ?? "Por confirmar",
      Icon: MapPin,
    },
    {
      label: "Horario",
      value: data.fecha
        ? `${data.fecha.horaInicio.slice(0, 5)}–${data.fecha.horaFin.slice(0, 5)} hrs`
        : "Por confirmar",
      Icon: Clock3,
    },
    {
      label: "Cupos disponibles",
      value:
        data.recinto?.aforo !== undefined
          ? `${data.cupoDisponible}/${data.recinto.aforo}`
          : String(data.cupoDisponible),
      Icon: UsersRound,
    },
  ];

  return (
    <PageContainer>
      <div className="space-y-8">
        <EventBanner posterUrl={data.posterUrl} eventName={data.nombreEvento} />

        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]">
          <div className="min-w-0 space-y-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="primary">Evento Privado</Badge>
                <Badge variant="secondary">
                  {obtenerEtiquetaModalidad(data.idModalidadAcceso)}
                </Badge>
              </div>
              <PageHeader title={data.nombreEvento} />
              <h2 className="break-words text-xl font-semibold text-eventos-secondary">
                {data.nombreSubEvento}
              </h2>
            </div>

            {data.descripcionEvento.trim() && (
              <section className="space-y-2">
                <h3 className="text-lg font-semibold text-eventos-ink">
                  Acerca del evento
                </h3>
                <p className="whitespace-pre-line leading-relaxed text-eventos-body-text">
                  {data.descripcionEvento}
                </p>
              </section>
            )}

            <section className="space-y-2">
              <h3 className="text-lg font-semibold text-eventos-ink">
                Descripción de la actividad
              </h3>
              <p className="whitespace-pre-line leading-relaxed text-eventos-body-text">
                {data.descripcionSubEvento.trim() ||
                  "La descripción aún no está disponible."}
              </p>
            </section>

            <SpeakersList speakers={speakers} />
          </div>

          <section
            aria-label="Información de la actividad privada"
            className="flex w-full flex-col gap-5 rounded-md border border-eventos-panel-border bg-eventos-panel-surface p-5 sm:p-7"
          >
            <h3 className="font-merriweather text-lg font-bold text-eventos-ink">
              Detalles de la sesión
            </h3>

            <dl className="space-y-3">
              {datos.map(({ label, value, Icon }) => (
                <div key={label} className="flex items-start gap-3">
                  <Icon
                    size={18}
                    className="mt-0.5 shrink-0 text-eventos-primary"
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-eventos-muted-text">
                      {label}
                    </dt>
                    <dd className="text-sm font-medium text-eventos-ink">
                      {value}
                    </dd>
                  </div>
                </div>
              ))}
            </dl>

            <ModalidadAccesoHelp idModalidadAcceso={data.idModalidadAcceso} />

            {data.esAccesoLibre ? (
              <FeedbackNotice variant="success" title="Acceso libre">
                Esta actividad es de acceso libre. No necesitas crear una cuenta
                ni reservar boleto para asistir.
              </FeedbackNotice>
            ) : (
              <div className="space-y-3 border-t border-eventos-divider pt-4">
                {data.sinCupo && !data.yaAutorizado ? (
                  <FeedbackNotice variant="warning" title="Cupo lleno">
                    Esta actividad alcanzó su aforo máximo y no admite más
                    registros por el momento.
                  </FeedbackNotice>
                ) : data.usuarioAutenticado ? (
                  <>
                    <Button
                      type="button"
                      variant="primary"
                      className="w-full"
                      disabled={aceptando}
                      text={
                        aceptando
                          ? "Confirmando acceso..."
                          : data.yaAutorizado
                            ? "Reservar lugar"
                            : "Confirmar asistencia / Reservar lugar"
                      }
                      onClick={() => void handleConfirmarAsistencia()}
                    />
                    {errorAceptar && (
                      <FeedbackNotice
                        variant="error"
                        title="No se pudo continuar"
                      >
                        {errorAceptar}
                      </FeedbackNotice>
                    )}
                  </>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-eventos-body-text">
                      Inicia sesión o regístrate para confirmar tu asistencia y
                      reservar tu lugar en esta actividad privada.
                    </p>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Link
                        to={loginPath}
                        className="inline-flex flex-1 items-center justify-center rounded-md bg-eventos-primary px-4 py-2.5 text-center text-sm font-semibold text-eventos-on-primary transition-colors hover:bg-eventos-action-hover"
                      >
                        Iniciar sesión
                      </Link>
                      <Link
                        to={registerPath}
                        className="inline-flex flex-1 items-center justify-center rounded-md border border-eventos-panel-border bg-white px-4 py-2.5 text-center text-sm font-semibold text-eventos-primary transition-colors hover:bg-gray-50"
                      >
                        Registrarse
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </PageContainer>
  );
}
