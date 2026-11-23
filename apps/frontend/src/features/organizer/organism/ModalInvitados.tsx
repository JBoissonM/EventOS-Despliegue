import { useMemo, useState, type ChangeEvent } from "react";
import type {
  AgregarInvitadosMasivoPayload,
  FalloEnvioInvitacionItem,
  InvitadoEventoItem,
  OmitidoInvitacionItem,
  ResultadoCargaMasivaInvitados,
} from "@eventos/shared";
import { apiRequest } from "../../../lib/apiClient";
import { Badge } from "../../../components/atoms/Badge/Badge";
import Button from "../../../components/atoms/Button/Button";
import { InputFile } from "../../../components/atoms/InputFile/InputFile";
import { TextArea } from "../../../components/atoms/TextArea/TextArea";
import { FeedbackNotice } from "../../../components/molecules/FeedbackNotice";
import { FormField } from "../../../components/molecules/FormField";
import { Modal } from "../../../components/molecules/Modal";
import { Table } from "../../../components/organisms/Table/Table";
import type { Columna } from "../../../components/organisms/Table/Table";

export interface TablaInvitados {
  id: number;
  nombre: string;
  correo: string;
}

interface ModalInvitadosProps {
  mostrarModal: boolean;
  idEvento?: string | number;
  idSubEvento?: number;
  foroRecinto?: number;
  numeroInvitados: number;
  correosExistentes?: string[];
  cerrarModal: () => void;
  guardar?: (invitados: TablaInvitados[]) => void;
  onEnvioCompletado?: (exitosos: InvitadoEventoItem[]) => void;
}

const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TAMANO_LOTE = 10;

function parsearCorreosTexto(
  texto: string,
  correosExistentesSet: Set<string>,
): {
  validos: string[];
  invalidos: string[];
  duplicados: string[];
} {
  const tokens = texto
    .split(/[\s,;]+/)
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

  const vistos = new Set<string>();
  const validos: string[] = [];
  const invalidos: string[] = [];
  const duplicados: string[] = [];

  for (const token of tokens) {
    if (!REGEX_CORREO.test(token)) {
      if (!invalidos.includes(token)) {
        invalidos.push(token);
      }
      continue;
    }
    if (vistos.has(token) || correosExistentesSet.has(token)) {
      if (!duplicados.includes(token)) {
        duplicados.push(token);
      }
      continue;
    }
    vistos.add(token);
    validos.push(token);
  }

  return { validos, invalidos, duplicados };
}

function dividirEnLotes<T>(lista: T[], tamano: number): T[][] {
  const lotes: T[][] = [];
  for (let i = 0; i < lista.length; i += tamano) {
    lotes.push(lista.slice(i, i + tamano));
  }
  return lotes;
}

export function ModalInvitados({
  mostrarModal,
  idEvento,
  idSubEvento,
  foroRecinto,
  numeroInvitados,
  correosExistentes = [],
  cerrarModal,
  guardar,
  onEnvioCompletado,
}: ModalInvitadosProps) {
  const [textoCorreos, setTextoCorreos] = useState("");
  const [errorArchivo, setErrorArchivo] = useState<string | null>(null);
  const [modalConfirmarSalida, setModalConfirmarSalida] = useState(false);
  const [modalConfirmarEnvio, setModalConfirmarEnvio] = useState(false);

  const [enviando, setEnviando] = useState(false);
  const [envioFinalizado, setEnvioFinalizado] = useState(false);
  const [totalAEnviar, setTotalAEnviar] = useState(0);
  const [procesados, setProcesados] = useState(0);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
  const [exitososAcumulados, setExitososAcumulados] = useState<
    InvitadoEventoItem[]
  >([]);
  const [pendientesRegistro, setPendientesRegistro] = useState<string[]>([]);
  const [omitidos, setOmitidos] = useState<OmitidoInvitacionItem[]>([]);
  const [fallidos, setFallidos] = useState<FalloEnvioInvitacionItem[]>([]);

  const correosExistentesSet = useMemo(() => {
    const set = new Set(correosExistentes.map((c) => c.trim().toLowerCase()));
    for (const ex of exitososAcumulados) {
      set.add(ex.correo.trim().toLowerCase());
    }
    return set;
  }, [correosExistentes, exitososAcumulados]);

  const { validos, invalidos, duplicados } = useMemo(
    () => parsearCorreosTexto(textoCorreos, correosExistentesSet),
    [textoCorreos, correosExistentesSet],
  );

  const invitadosActualesTotales = numeroInvitados + exitososAcumulados.length;
  const cupoDisponible =
    foroRecinto !== undefined
      ? Math.max(0, foroRecinto - invitadosActualesTotales)
      : undefined;
  const sinCupo = cupoDisponible !== undefined && cupoDisponible <= 0;
  const excedeAforo =
    cupoDisponible !== undefined && validos.length > cupoDisponible;
  const totalProyectado = invitadosActualesTotales + validos.length;

  const filasVistaPrevia: TablaInvitados[] = useMemo(
    () =>
      validos.map((correo, idx) => ({
        id: idx + 1,
        nombre: "",
        correo,
      })),
    [validos],
  );

  const columnasVistaPrevia: Columna<TablaInvitados>[] = useMemo(
    () => [
      {
        id: "correo",
        encabezado: "Correo válido",
        render: (p) => p.correo,
        className: "px-3 py-2",
      },
      {
        id: "acciones",
        encabezado: "Acción",
        render: (p) => (
          <Button
            text="Quitar"
            variant="danger"
            type="button"
            disabled={enviando}
            onClick={() => quitarCorreoDeTexto(p.correo)}
          />
        ),
        className: "w-24 px-3 py-2 text-center",
      },
    ],
    [enviando],
  );

  function quitarCorreoDeTexto(correoObjetivo: string) {
    const tokens = textoCorreos
      .split(/[\s,;]+/)
      .map((t) => t.trim())
      .filter(Boolean)
      .filter((t) => t.toLowerCase() !== correoObjetivo.toLowerCase());
    setTextoCorreos(tokens.join(", "));
  }

  async function handleArchivoCsv(e: ChangeEvent<HTMLInputElement>) {
    setErrorArchivo(null);
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    if (!archivo.name.toLowerCase().endsWith(".csv")) {
      setErrorArchivo("El archivo debe tener extensión .csv.");
      return;
    }

    try {
      const contenido = await archivo.text();
      const limpios = contenido
        .replace(/^\uFEFF/, "")
        .split(/[\r\n,;]+/)
        .map((c) => c.trim())
        .filter((c) => c && !c.toLowerCase().startsWith("correo"));

      if (limpios.length === 0) {
        setErrorArchivo("El archivo CSV no contiene correos.");
        return;
      }

      setTextoCorreos((prev) =>
        prev.trim()
          ? `${prev.trim()}, ${limpios.join(", ")}`
          : limpios.join(", "),
      );
    } catch {
      setErrorArchivo("No se pudo leer el archivo CSV.");
    } finally {
      e.target.value = "";
    }
  }

  async function ejecutarEnvioLotes(correosAEnviar: string[]) {
    if (!idEvento || !idSubEvento) {
      guardar?.(
        correosAEnviar.map((correo, idx) => ({
          id: Date.now() + idx,
          nombre: "",
          correo,
        })),
      );
      handleCerrar();
      return;
    }

    setModalConfirmarEnvio(false);
    setEnviando(true);
    setEnvioFinalizado(false);
    setErrorEnvio(null);
    setTotalAEnviar(correosAEnviar.length);
    setProcesados(0);
    setFallidos([]);

    const lotes = dividirEnLotes(correosAEnviar, TAMANO_LOTE);
    const nuevosExitosos: InvitadoEventoItem[] = [];
    const nuevosPendientes: string[] = [];
    const nuevosOmitidos: OmitidoInvitacionItem[] = [];
    const nuevosFallidos: FalloEnvioInvitacionItem[] = [];
    let acumuladosProcesados = 0;

    for (const lote of lotes) {
      try {
        const payload: AgregarInvitadosMasivoPayload = { correos: lote };
        const res = await apiRequest<ResultadoCargaMasivaInvitados>(
          `eventos/${idEvento}/subeventos/${idSubEvento}/invitados/masivo`,
          {
            method: "POST",
            body: JSON.stringify(payload),
          },
        );
        acumuladosProcesados += res.totalProcesados ?? lote.length;
        setProcesados(Math.min(acumuladosProcesados, correosAEnviar.length));

        if (Array.isArray(res.exitosos)) {
          nuevosExitosos.push(...res.exitosos);
        }
        if (Array.isArray(res.pendientesRegistro)) {
          nuevosPendientes.push(...res.pendientesRegistro);
        }
        if (Array.isArray(res.omitidos)) {
          nuevosOmitidos.push(...res.omitidos);
        }
        if (Array.isArray(res.fallidos)) {
          nuevosFallidos.push(...res.fallidos);
        }
      } catch (err) {
        const motivo =
          err instanceof Error
            ? err.message
            : "Error al enviar el lote de invitaciones.";
        setErrorEnvio(motivo);
        for (const correo of lote) {
          nuevosFallidos.push({ correo, motivo });
        }
        acumuladosProcesados += lote.length;
        setProcesados(Math.min(acumuladosProcesados, correosAEnviar.length));
      }
    }

    if (nuevosExitosos.length > 0) {
      setExitososAcumulados((prev) => [...prev, ...nuevosExitosos]);
      onEnvioCompletado?.(nuevosExitosos);
    }
    if (nuevosPendientes.length > 0) {
      setPendientesRegistro((prev) => [
        ...new Set([...prev, ...nuevosPendientes]),
      ]);
    }
    if (nuevosOmitidos.length > 0) {
      setOmitidos((prev) => [...prev, ...nuevosOmitidos]);
    }

    setFallidos(nuevosFallidos);
    setEnviando(false);
    setEnvioFinalizado(true);

    if (nuevosFallidos.length === 0) {
      setTextoCorreos("");
    }
  }

  function handleSolicitarCerrar() {
    if (enviando) return;
    if (textoCorreos.trim().length > 0 && !envioFinalizado) {
      setModalConfirmarSalida(true);
    } else {
      handleCerrar();
    }
  }

  function handleCerrar() {
    if (enviando) return;
    setTextoCorreos("");
    setErrorArchivo(null);
    setModalConfirmarSalida(false);
    setModalConfirmarEnvio(false);
    setEnviando(false);
    setEnvioFinalizado(false);
    setTotalAEnviar(0);
    setProcesados(0);
    setErrorEnvio(null);
    setExitososAcumulados([]);
    setPendientesRegistro([]);
    setOmitidos([]);
    setFallidos([]);
    cerrarModal();
  }

  const porcentajeProgreso =
    totalAEnviar > 0 ? Math.round((procesados / totalAEnviar) * 100) : 0;

  const puedeEnviar =
    !enviando &&
    !sinCupo &&
    !excedeAforo &&
    validos.length > 0 &&
    invalidos.length === 0;

  return (
    <>
      <Modal
        mostrarModal={
          mostrarModal && !modalConfirmarSalida && !modalConfirmarEnvio
        }
        titulo="Agregar invitados"
        contenido="Puedes agregar manualmente los correos electrónicos de tus invitados o subir un archivo CSV."
        cerrarModal={handleSolicitarCerrar}
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-bold font-merriweather text-eventos-ink">
              {foroRecinto !== undefined
                ? `Aforo: ${totalProyectado}/${foroRecinto} invitados`
                : `Invitados a agregar: ${validos.length}`}
            </h2>
          </div>

          {sinCupo && (
            <FeedbackNotice variant="warning" title="Aforo completo">
              Se alcanzó el aforo máximo del recinto ({foroRecinto}). No es
              posible agregar más invitados.
            </FeedbackNotice>
          )}

          <FormField
            label="Archivo CSV (opcional)"
            htmlFor="campoCSV"
            mensajeAyuda="El archivo debe terminar en .csv"
            errorMessage={errorArchivo ?? undefined}
          >
            <InputFile
              id="campoCSV"
              accept=".csv"
              disabled={enviando || sinCupo}
              hasError={Boolean(errorArchivo)}
              onChange={handleArchivoCsv}
            />
          </FormField>

          <FormField
            htmlFor="campoCorreo"
            label="Correos electrónicos"
            tooltip={`Separadores aceptados: saltos de línea, espacios, comas (,) o punto y coma (;).${
              foroRecinto !== undefined
                ? ` Límite máximo del recinto: ${foroRecinto} asistentes.`
                : ""
            } `}
            mensajeAyuda="Para agregar varios correos electrónicos, sepáralos mediante espacios, saltos de línea, comas (,) o punto y coma (;)."
            errorMessage={
              excedeAforo
                ? `La lista de correos excede el cupo disponible (${cupoDisponible} lugares)`
                : undefined
            }
          >
            <TextArea
              id="campoCorreo"
              value={textoCorreos}
              disabled={enviando || sinCupo}
              hasError={invalidos.length > 0 || excedeAforo}
              onChange={(e) => setTextoCorreos(e.target.value)}
              placeholder="ejemplo1@ipn.mx, ejemplo2@gmail.com"
              rows={4}
              className="resize-none"
            />
          </FormField>

          {invalidos.length > 0 && (
            <FeedbackNotice variant="error">
              <p className="mb-2 text-xs">
                Se ha detectado un formato invalido en los siguientes correos:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {invalidos.map((item) => (
                  <span
                    key={item}
                    className="rounded py-0.5 text-xs font-medium text-red-800"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </FeedbackNotice>
          )}

          {duplicados.length > 0 && (
            <p className="text-xs text-gray-600">
              Se omitieron {duplicados.length} correo(s) duplicado(s) o ya
              invitados.
            </p>
          )}

          {(enviando || envioFinalizado) && totalAEnviar > 0 && (
            <div className="space-y-2 rounded-md border border-gray-200 bg-gray-50 p-3">
              <div className="flex items-center justify-between text-xs font-medium text-eventos-ink">
                <span>
                  {enviando
                    ? "Enviando invitaciones..."
                    : "Proceso de envío completado"}
                </span>
                <span>
                  {procesados}/{totalAEnviar} ({porcentajeProgreso}%)
                </span>
              </div>
              <div
                role="progressbar"
                aria-valuenow={porcentajeProgreso}
                aria-valuemin={0}
                aria-valuemax={100}
                className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200"
              >
                <div
                  className="h-full bg-eventos-primary transition-all duration-300"
                  style={{ width: `${porcentajeProgreso}%` }}
                />
              </div>
            </div>
          )}

          {errorEnvio && (
            <FeedbackNotice variant="error" title="Error en el envío">
              {errorEnvio}
            </FeedbackNotice>
          )}

          {envioFinalizado && fallidos.length === 0 && !errorEnvio && (
            <FeedbackNotice variant="success" title="Invitaciones procesadas">
              Exitosos: {exitososAcumulados.length}.
              {pendientesRegistro.length > 0 &&
                ` Pendientes de registro: ${pendientesRegistro.length}.`}
              {omitidos.length > 0 && ` Omitidos: ${omitidos.length}.`}
            </FeedbackNotice>
          )}

          {fallidos.length > 0 && (
            <FeedbackNotice
              variant="error"
              title={`Correos fallidos (${fallidos.length})`}
              action={
                <Button
                  text="Reintentar fallidos"
                  variant="primary"
                  type="button"
                  disabled={enviando}
                  onClick={() =>
                    void ejecutarEnvioLotes(fallidos.map((f) => f.correo))
                  }
                />
              }
            >
              <ul className="list-disc space-y-1 pl-4">
                {fallidos.map((item) => (
                  <li key={item.correo}>
                    <strong>{item.correo}:</strong> {item.motivo}
                  </li>
                ))}
              </ul>
            </FeedbackNotice>
          )}
        </div>

        <div className="mt-4 border-t border-gray-200 pt-4">
          <div className="grid grid-cols-2 gap-3 sm:flex sm:justify-end">
            <Button
              text={envioFinalizado ? "Cerrar" : "Volver"}
              variant="secondary"
              type="button"
              disabled={enviando}
              className="w-full sm:w-auto"
              onClick={handleSolicitarCerrar}
            />
            {(!envioFinalizado || validos.length > 0) && (
              <Button
                text={
                  idEvento && idSubEvento ? "Enviar invitaciones" : "Guardar"
                }
                variant="success"
                type="button"
                className="w-full sm:w-auto"
                disabled={!puedeEnviar}
                onClick={() => setModalConfirmarEnvio(true)}
              />
            )}
          </div>
        </div>
      </Modal>

      {modalConfirmarEnvio && (
        <Modal
          mostrarModal={modalConfirmarEnvio}
          titulo="Confirmar envío de invitaciones"
          contenido={`Se procesarán ${validos.length} correo(s) electrónico(s) para este subevento.`}
          cerrarModal={() => setModalConfirmarEnvio(false)}
        >
          <div className="flex justify-center gap-3 pt-2 md:justify-end">
            <Button
              text="Cancelar"
              variant="secondary"
              type="button"
              onClick={() => setModalConfirmarEnvio(false)}
            />
            <Button
              text="Confirmar y enviar"
              variant="success"
              type="button"
              onClick={() => void ejecutarEnvioLotes(validos)}
            />
          </div>
        </Modal>
      )}

      {modalConfirmarSalida && (
        <Modal
          mostrarModal={modalConfirmarSalida}
          titulo="Advertencia"
          contenido="¿Estás seguro que deseas salir? Los correos que ingresaste se perderán."
          cerrarModal={() => setModalConfirmarSalida(false)}
        >
          <div className="flex justify-center gap-3 pt-2 md:justify-end">
            <Button
              text="Cancelar"
              variant="secondary"
              type="button"
              onClick={() => setModalConfirmarSalida(false)}
            />
            <Button
              text="Descartar y salir"
              variant="danger"
              type="button"
              onClick={handleCerrar}
            />
          </div>
        </Modal>
      )}
    </>
  );
}
