import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { User } from "lucide-react";
import { Button } from "../../components/atoms/Button/Button";
import { Html5Qrcode } from "html5-qrcode";

interface AsistenteInfo {
  nombre: string;
  ocupacion: string;
}

export function EscanearBoleto() {
  const { idSubEvento } = useParams<{ idSubEvento: string }>();
  const navigate = useNavigate();

  const [aforoActual, setAforoActual] = useState<number>(0);
  const [aforoMaximo, setAforoMaximo] = useState<number>(50);
  const [escaneando, setEscaneando] = useState<boolean>(false);
  const [errorCamara, setErrorCamara] = useState<string | null>(null);

  const [estadoEscaneo, setEstadoEscaneo] = useState<"valido" | "denegado" | null>(null);
  const [datosAsistente, setDatosAsistente] = useState<AsistenteInfo | null>(null);
  const [mensajeError, setMensajeError] = useState<string>("");

  const scannerRef = useRef<Html5Qrcode | null>(null);

  const getToken = () => {
    const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
    return usuario.token || localStorage.getItem("token") || "";
  };

  // Cargar aforo inicial
  useEffect(() => {
    if (!idSubEvento) return;
    fetch(`http://localhost:3000/api/logistica/subeventos/${idSubEvento}/control-acceso`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setAforoActual(data.aforoActual ?? 0);
          setAforoMaximo(data.aforoMaximo ?? 50);
        }
      })
      .catch((err) => console.error(err));
  }, [idSubEvento]);

  const handleEscanearQr = async (qrValue: string) => {
    if (!qrValue.trim() || escaneando) return;
    setEscaneando(true);

    try {
      const response = await fetch(`http://localhost:3000/api/logistica/subeventos/${idSubEvento}/escanear`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ tokenQr: qrValue.trim() }),
      });

      const resData = await response.json();

      if (!response.ok) {
        setEstadoEscaneo("denegado");
        setMensajeError(resData.message || "Boleto duplicado / Ya utilizado");
      } else {
        setEstadoEscaneo("valido");
        
        // Mapeo flexible para capturar cualquier nombre de propiedad que mande el backend
        const info = resData.asistente || resData;
        setDatosAsistente({
          nombre: info.nombre || info.nombreCompleto || "Asistente",
          ocupacion: info.ocupacion || info.perfil || info.rol || "Participante",
        });

        if (resData.aforoActual !== undefined) {
          setAforoActual(resData.aforoActual);
        } else {
          setAforoActual((prev) => prev + 1);
        }
      }
    } catch (err) {
      setEstadoEscaneo("denegado");
      setMensajeError("Error de conexión al validar el boleto.");
    } finally {
      setEscaneando(false);
    }
  };

  // Inicializar el escáner de la cámara en tiempo real
  useEffect(() => {
    const scannerId = "reader-qr";
    const html5QrCode = new Html5Qrcode(scannerId);
    scannerRef.current = html5QrCode;

    if (!estadoEscaneo) {
      html5QrCode
        .start(
          { facingMode: "environment" }, // Cámara trasera en dispositivos móviles
          {
            fps: 10,
            qrbox: { width: 240, height: 240 },
          },
          (decodedText) => {
            // Se detectó y decodificó un código QR con éxito
            handleEscanearQr(decodedText);
          },
          () => {
            // Ignorar errores de lectura por fotograma individual
          }
        )
        .catch((err) => {
          console.error("Error al iniciar la cámara:", err);
          setErrorCamara("No se pudo iniciar la cámara. Verifica los permisos del navegador.");
        });
    }

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current
          .stop()
          .catch((err) => console.error("Error al detener el escáner:", err));
      }
    };
  }, [estadoEscaneo]);

  return (
    <div className="fixed inset-0 w-screen h-screen bg-black font-merriweather text-white flex flex-col justify-between overflow-hidden">
      <div id="reader-qr" className="absolute inset-0 w-full h-full z-0 overflow-hidden bg-black object-cover" />

      <main className="relative z-10 flex-1 flex flex-col items-center justify-between px-4 py-8 max-w-md mx-auto w-full text-center pointer-events-none">
        
        {/* Aforo Actual */}
        <div className="space-y-0.5 pointer-events-auto">
          <div className="text-3xl font-extrabold tracking-tight drop-shadow-md">
            {aforoActual}/{aforoMaximo}
          </div>
          <p className="text-xs uppercase tracking-wider text-gray-200 font-semibold drop-shadow">Aforo Actual</p>
        </div>

        {errorCamara && (
          <div className="p-3 bg-red-900/90 text-red-200 text-xs rounded-lg pointer-events-auto">
            {errorCamara}
          </div>
        )}

        {/* Mensaje inferior y Botón Cancelar */}
        <div className="w-full flex flex-col items-center space-y-4 pointer-events-auto">
          <p className="text-xs italic text-gray-200 drop-shadow bg-black/50 px-4 py-1.5 rounded-full">
            "Centra el código QR del boleto dentro del marco"
          </p>

          <div className="w-full max-w-xs">
            <Button
              text="Cancelar"
              variant="primary"
              onClick={() => navigate(-1)}
              className="w-full py-3 bg-[#5c1d33] hover:bg-[#4a1c2d] text-white font-semibold rounded-lg shadow-lg transition-colors font-merriweather"
            />
          </div>
        </div>
      </main>

      {/* MODAL POST-ESCANEO: ACCESO VÁLIDO */}
      {estadoEscaneo === "valido" && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white text-gray-900 rounded-2xl p-8 max-w-xs sm:max-w-sm w-full text-center shadow-2xl space-y-6 font-merriweather animate-in fade-in zoom-in-95">
            <h2 className="text-2xl font-bold text-green-700">Acceso Válido</h2>
            <div className="space-y-1 text-sm sm:text-base">
              <p><strong>Nombre:</strong> {datosAsistente?.nombre}</p>
              <p><strong>Perfil:</strong> {datosAsistente?.ocupacion}</p>
            </div>
            <Button
              text="Escanear Siguiente"
              variant="primary"
              onClick={() => setEstadoEscaneo(null)}
              className="w-full py-3 bg-green-700 hover:bg-green-800 text-white font-semibold rounded-lg shadow transition-colors font-merriweather"
            />
          </div>
        </div>
      )}

      {/* MODAL POST-ESCANEO: ACCESO DENEGADO */}
      {estadoEscaneo === "denegado" && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white text-gray-900 rounded-2xl p-8 max-w-xs sm:max-w-sm w-full text-center shadow-2xl space-y-6 font-merriweather animate-in fade-in zoom-in-95">
            <h2 className="text-2xl font-bold text-red-700">Acceso Denegado</h2>
            <p className="text-sm font-semibold text-gray-800">{mensajeError}</p>
            <Button
              text="Reintentar"
              variant="primary"
              onClick={() => setEstadoEscaneo(null)}
              className="w-full py-3 bg-[#5c1d33] hover:bg-[#4a1c2d] text-white font-semibold rounded-lg shadow transition-colors font-merriweather"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default EscanearBoleto;