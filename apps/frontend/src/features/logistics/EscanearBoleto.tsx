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
  
  const [isReady, setIsReady] = useState<boolean>(false);

  const [estadoEscaneo, setEstadoEscaneo] = useState<"valido" | "denegado" | null>(null);
  const [datosAsistente, setDatosAsistente] = useState<AsistenteInfo | null>(null);
  const [mensajeError, setMensajeError] = useState<string>("");

  const scannerRef = useRef<Html5Qrcode | null>(null);

  const getToken = () => {
    const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
    return usuario.token || localStorage.getItem("token") || "";
  };

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

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

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
        
        const asistente = resData.asistenteRecienIngresado;
        setDatosAsistente({
          nombre: asistente?.nombre || "Asistente",
          ocupacion: asistente?.ocupacion || "Participante",
        });

        if (resData.controlAcceso?.aforoActual !== undefined) {
          setAforoActual(resData.controlAcceso.aforoActual);
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

  useEffect(() => {
    if (!isReady || estadoEscaneo) return;

    const scannerId = "reader-qr";
    const html5QrCode = new Html5Qrcode(scannerId);
    scannerRef.current = html5QrCode;
    let isCancelled = false;

    html5QrCode
      .start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);

            const minSize = 200;
            const maxSize = 280;

            let boxSize = Math.floor(minEdge * 0.7);

            if (minEdge < 260) {
              boxSize = Math.floor(minEdge * 0.8);
            } else {
              boxSize = Math.min(Math.max(boxSize, minSize), maxSize);
            }

            boxSize = Math.max(50, Math.min(boxSize, minEdge - 24));

            return {
              width: boxSize,
              height: boxSize,
            };
          },
        },
        (decodedText) => {
          handleEscanearQr(decodedText);
        },
        () => {}
      )
      .then(() => {
        if (isCancelled && html5QrCode.isScanning) {
          html5QrCode.stop().catch((err) => console.error("Error al detener el escáner cancelado:", err));
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          console.error("Error al iniciar la cámara:", err);
          setErrorCamara("No se pudo iniciar la cámara. Verifica los permisos del navegador.");
        }
      });

    return () => {
      isCancelled = true;
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current
          .stop()
          .catch((err) => console.error("Error al detener el escáner:", err));
      }
    };
  }, [isReady, estadoEscaneo]);

  return (
    <div className="fixed inset-0 w-screen h-screen bg-black font-merriweather text-white flex flex-col justify-between overflow-hidden">
      
      <div className="absolute inset-0 w-full h-full z-0 overflow-hidden bg-black flex items-center justify-center">
        {isReady && <div id="reader-qr" className="w-full max-w-lg overflow-hidden" />}
      </div>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-between px-4 py-8 max-w-md mx-auto w-full text-center pointer-events-none">
        
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

        <div className="w-full flex flex-col items-center space-y-4 pointer-events-auto">
          <p className="text-xs italic text-gray-200 drop-shadow bg-black/50 px-4 py-1.5 rounded-full">
            "Centra el código QR del boleto dentro del marco"
          </p>

          <div className="w-full max-w-xs">
            <Button text="Cancelar" variant="primary" onClick={() => navigate(-1)} className="w-full py-3 font-semibold rounded-lg shadow-lg transition-colors font-merriweather"/>
          </div>
        </div>
      </main>

      {estadoEscaneo === "valido" && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white text-gray-900 rounded-2xl p-8 max-w-xs sm:max-w-sm w-full text-center shadow-2xl space-y-6 font-merriweather">
            <h2 className="text-2xl font-bold text-green-700">Acceso Válido</h2>
            <div className="space-y-1 text-sm sm:text-base">
              <p><strong>Nombre:</strong> {datosAsistente?.nombre}</p>
              <p><strong>Perfil:</strong> {datosAsistente?.ocupacion}</p>
            </div>
            <Button text="Escanear Siguiente" variant="primary" onClick={() => setEstadoEscaneo(null)} className="w-full py-3 bg-green-700 hover:bg-green-800 text-white font-semibold rounded-lg shadow transition-colors font-merriweather"/>
          </div>
        </div>
      )}

      {estadoEscaneo === "denegado" && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white text-gray-900 rounded-2xl p-8 max-w-xs sm:max-w-sm w-full text-center shadow-2xl space-y-6 font-merriweather">
            <h2 className="text-2xl font-bold text-red-700">Acceso Denegado</h2>
            <p className="text-sm font-semibold text-gray-800">{mensajeError}</p>
            <Button text="Reintentar" variant="primary" onClick={() => setEstadoEscaneo(null)} className="w-full py-3 font-semibold rounded-lg shadow transition-colors font-merriweather"/>
          </div>
        </div>
      )}
    </div>
  );
}

export default EscanearBoleto;