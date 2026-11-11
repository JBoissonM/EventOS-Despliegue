import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { QrCode, Users, LoaderCircle, AlertCircle } from "lucide-react";
import { API_BASE_URL } from "../../lib/apiClient";
import { Button } from "../../components/atoms/Button/Button";

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
  aforoActual: number;
  aforoMaximo: number;
  listaAsistentes: Asistente[];
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

  return (
    <div className="min-h-1 bg-gray-50 font-merriweather text-gray-800">
      <main className="mx-auto w-full px-10 py-0">
        <div className="mb-2">
          <button onClick={() => navigate("/panel-eventos-asignados")} className="flex items-center text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors">
            <span className="font-merriweather text-[20px] mr-3">← Volver a los eventos asignados</span>
          </button>
        </div>
        <div className="mb-8">
          <h1 className="text-[36px] font-bold text-gray-900 mb-2">Control de Acceso</h1>
          <h2 className="text-[28px] text-teal-800">
            {data?.nombreSubEvento || "Actividad del Evento"}
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          <div className="p-8 flex flex-col items-center text-center space-y-8">
            <div className="space-y-2">
              <div className="text-[36px] font-semibold text-gray-900 tracking-tight font-merriweather">
                {data?.aforoActual ?? 0}/{data?.aforoMaximo ?? 50}
              </div>
              <p className="text-[24px] font-semibold text-gray-900">Aforo Actual</p>
            </div>

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
          </div>

          <div className="bg-white rounded-xl border border-gray-300 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2 font-merriweather">
                <Users size={22} className="text-primary" /> Lista de Asistentes
              </h3>
            </div>

            <div className="overflow-x-auto max-h-100 overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-gray-50 border-b border-gray-300 text-sm font-bold text-gray-700">
                  <tr>
                    <th className="p-3">Nombre</th>
                    <th className="p-3">Ocupación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-sm">
                  {data?.listaAsistentes && data.listaAsistentes.length > 0 ? (
                    data.listaAsistentes.map((asistente, index) => (
                      <tr key={index} className="hover:bg-gray-50/50">
                        <td className="p-3 text-gray-900 font-medium">{asistente.nombre}</td>
                        <td className="p-3 text-gray-600">{asistente.ocupacion}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={2} className="p-6 text-center text-gray-400 italic">
                        Ningún asistente ha accedido todavía.
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