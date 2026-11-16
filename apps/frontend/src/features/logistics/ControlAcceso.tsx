import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { QrCode, Users, LoaderCircle, AlertCircle } from "lucide-react";
import { ModalidadAcceso } from "@eventos/shared";
import { API_BASE_URL } from "../../lib/apiClient";
import { Badge } from "../../components/atoms/Badge/Badge";
import { Button } from "../../components/atoms/Button/Button";
import { CardMetricas } from "../../components/molecules/CardMetricas";
import { FeedbackNotice } from "../../components/molecules/FeedbackNotice";
import { ModalidadAccesoHelp } from "../../components/molecules/ModalidadAccesoHelp";

interface Asistente {
  idBoleto?: number;
  idUsuario?: number;
  nombre: string;
  ocupacion: string;
  correo?: string;
  ingresado?: boolean;
  asiento?: string;
}

interface ControlAccesoData {
  nombreSubEvento: string;
  nombreEvento: string;
  idModalidadAcceso?: number;
  etiquetaModalidad?: string;
  requiereEscaneoQR?: boolean;
  aforoActual: number;
  aforoMaximo: number;
  totalInscritos?: number;
  totalIngresados?: number;
  listaAsistentes: Asistente[];
  listaReservados?: Asistente[];
}

export function ControlAcceso() {
  const { idSubEvento } = useParams<{ idSubEvento: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<ControlAccesoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getToken = () => {
    const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
    return usuario.token || localStorage.getItem("token") || "";
  };

  const cargarDatosControl = async () => {
    if (!idSubEvento) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/logistica/subeventos/${idSubEvento}/control-acceso`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.message || "No se pudo cargar la información de control de acceso.");
      }

      setData(resData);
    } catch (err: any) {
      setError(err.message || "Error al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatosControl();
  }, [idSubEvento]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center font-merriweather text-gray-600">
        <LoaderCircle size={36} className="animate-spin text-[#5c1d33]" />
        <span className="ml-3">Cargando panel de control de acceso...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 font-merriweather text-center">
        <AlertCircle size={48} className="text-red-600 mb-3" />
        <p className="text-lg font-semibold text-gray-900 mb-4">{error}</p>
        <Button text="Regresar a Mis Eventos" variant="primary" onClick={() => navigate("/mis-eventos-asignados")} />
      </div>
    );
  }

  const requiresQr = data?.requiereEscaneoQR !== false;
  const isSimpleRegistration = data?.idModalidadAcceso === ModalidadAcceso.REGISTRO_SIMPLE;
  const displayList = isSimpleRegistration
    ? (data?.listaReservados ?? data?.listaAsistentes ?? [])
    : (data?.listaAsistentes ?? []);
  const enteredCount = data?.totalIngresados ?? data?.aforoActual ?? 0;
  const enrolledCount = data?.totalInscritos ?? 0;
  const maxCapacity = data?.aforoMaximo ?? 50;

  return (
    <div className="min-h-1 bg-gray-50 font-merriweather text-gray-800">
      <main className="mx-auto w-full px-10 py-0">
        <div className="mb-2">
          <button onClick={() => navigate("/panel-eventos-asignados")} className="flex items-center text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors">
            <span className="font-merriweather text-[20px] mr-3">← Volver a los eventos asignados</span>
          </button>
        </div>
        <div className="mb-8 space-y-2">
          <h1 className="text-[36px] font-bold text-gray-900">Control de Acceso</h1>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-[28px] text-teal-800">
              {data?.nombreSubEvento || "Actividad del Evento"}
            </h2>
            {data?.etiquetaModalidad && (
              <Badge variant="secondary" size="md">
                {data.etiquetaModalidad}
              </Badge>
            )}
          </div>
          {data?.idModalidadAcceso && (
            <ModalidadAccesoHelp
              idModalidadAcceso={data.idModalidadAcceso as ModalidadAcceso}
              className="max-w-2xl"
            />
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          <div className="p-8 flex flex-col items-center text-center space-y-6">
            {requiresQr ? (
              <div className="flex flex-wrap justify-center gap-4">
                <CardMetricas titulo="Ingresados" className="min-w-[11rem]">
                  <span className="font-merriweather font-bold text-3xl">
                    {enteredCount}/{maxCapacity}
                  </span>
                </CardMetricas>
                <CardMetricas titulo="Inscritos" className="min-w-[11rem]">
                  <span className="font-merriweather font-bold text-3xl">
                    {enrolledCount}/{maxCapacity}
                  </span>
                </CardMetricas>
              </div>
            ) : isSimpleRegistration ? (
              <CardMetricas titulo="Inscritos confirmados">
                <span className="font-merriweather font-bold text-3xl">
                  {enrolledCount}/{maxCapacity}
                </span>
              </CardMetricas>
            ) : (
              <CardMetricas titulo="Aforo del recinto">
                <span className="font-merriweather font-bold text-3xl">
                  {maxCapacity}
                </span>
              </CardMetricas>
            )}

            {requiresQr ? (
              <div className="w-70">
                <Button
                  text="Abrir Escáner"
                  variant="primary"
                  onClick={() => navigate(`/escanear-boleto/${idSubEvento}`)}
                  className="w-full py-4 font-semibold rounded-lg shadow transition-colors flex items-center justify-center gap-2 font-merriweather bg-[#5c1d33] hover:bg-[#4a1c2d] text-white"
                >
                  <QrCode size={22} /> Abrir Escáner
                </Button>
              </div>
            ) : (
              <div className="max-w-md text-left">
                <FeedbackNotice variant="warning" title="Escáner QR deshabilitado">
                  {isSimpleRegistration
                    ? "Esta actividad utiliza registro simple. Valida a los participantes directamente en la lista de inscritos."
                    : "Esta actividad es de acceso libre hasta completar el aforo del recinto."}
                </FeedbackNotice>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-300 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2 font-merriweather">
                <Users size={22} className="text-primary" /> {isSimpleRegistration ? "Lista de Inscritos" : "Lista de Asistentes"}
              </h3>
            </div>

            <div className="overflow-x-auto max-h-100 overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-gray-50 border-b border-gray-300 text-sm font-bold text-gray-700">
                  <tr>
                    <th className="p-3">Nombre</th>
                    <th className="p-3">Ocupación</th>
                    {isSimpleRegistration && <th className="p-3">Correo</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-sm">
                  {displayList.length > 0 ? (
                    displayList.map((asistente, index) => (
                      <tr key={asistente.idBoleto ?? index} className="hover:bg-gray-50/50">
                        <td className="p-3 text-gray-900 font-medium">{asistente.nombre}</td>
                        <td className="p-3 text-gray-600">{asistente.ocupacion}</td>
                        {isSimpleRegistration && (
                          <td className="p-3 text-gray-600">{asistente.correo || "—"}</td>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={isSimpleRegistration ? 3 : 2} className="p-6 text-center text-gray-400 italic">
                        {isSimpleRegistration
                          ? "Ningún asistente se ha registrado todavía."
                          : "Ningún asistente ha accedido todavía."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ControlAcceso;