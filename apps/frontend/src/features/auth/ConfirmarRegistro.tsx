import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router";
import { API_BASE_URL } from "../../lib/apiClient";
import { Button } from "../../components/atoms/Button/Button";
import { LoaderCircle, CheckCircle2, AlertCircle, CheckCircle, ArrowRight } from "lucide-react";

type EstadoVerificacion = "cargando" | "exito" | "ya_verificado" | "error";

export function ConfirmarRegistro() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [estado, setEstado] = useState<EstadoVerificacion>("cargando");
  const [mensaje, setMensaje] = useState<string>("");
  const [nombreUsuario, setNombreUsuario] = useState<string>("");

  const intentoRealizado = useRef(false);

  useEffect(() => {
    if (intentoRealizado.current) return;
    intentoRealizado.current = true;

    if (!token.trim()) {
      setEstado("error");
      setMensaje("No se proporcionó ningún token de verificación o el enlace está incompleto.");
      return;
    }

    const verificarToken = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/confirmar-registro`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token: token.trim() }),
        });

        const data = await response.json();

        if (response.ok) {
          setEstado("exito");
          setMensaje(data.mensaje || "Tu correo electrónico ha sido verificado y tu cuenta ha sido activada.");
          if (data.usuario?.nombre) {
            setNombreUsuario(`${data.usuario.nombre} ${data.usuario.apellidoPa || ""}`.trim());
          }
        } else if (response.status === 409) {
          setEstado("ya_verificado");
          setMensaje(data.message || "Esta cuenta ya fue verificada y registrada anteriormente. Ya puedes iniciar sesión.");
        } else {
          setEstado("error");
          setMensaje(data.message || "El enlace de verificación es inválido, ya fue utilizado o ha expirado.");
        }
      } catch (err) {
        setEstado("error");
        setMensaje("Ocurrió un error al conectar con el servidor. Por favor verifica tu conexión e inténtalo de nuevo.");
      }
    };

    verificarToken();
  }, [token]);

  return (
    <div className="flex min-h-[calc(100vh-160px)] items-center justify-center p-4 font-merriweather">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 sm:p-10 shadow-sm border border-gray-100 text-center space-y-6">
        {estado === "cargando" && (
          <div className="space-y-4 py-6">
            <div className="flex justify-center">
              <LoaderCircle className="w-16 h-16 animate-spin text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Verificando tu correo...
            </h1>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed max-w-md mx-auto">
              Estamos validando tu enlace de confirmación y activando tu cuenta en EventOS. Esto solo tomará unos segundos.
            </p>
          </div>
        )}

        {estado === "exito" && (
          <div className="space-y-5 py-4 animate-in fade-in duration-300">
            <div className="flex justify-center">
              <div className="bg-green-100 p-4 rounded-full text-green-600 shadow-inner">
                <CheckCircle2 className="w-16 h-16" />
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                ¡Correo verificado con éxito!
              </h1>
              {nombreUsuario && (
                <p className="text-lg font-semibold text-primary">
                  ¡Bienvenido(a), {nombreUsuario}!
                </p>
              )}
            </div>

            <p className="text-sm sm:text-base text-gray-600 leading-relaxed max-w-md mx-auto">
              Tu cuenta ha sido activada y registrada correctamente en la plataforma. Ya puedes iniciar sesión con tu correo electrónico y tu contraseña.
            </p>

            <div className="pt-4 max-w-xs mx-auto">
              <Button
                text="Iniciar Sesión"
                variant="primary"
                onClick={() => navigate("/login")}
                className="w-full py-3 font-semibold rounded-lg shadow-md transition-colors"
              />
            </div>
          </div>
        )}

        {estado === "ya_verificado" && (
          <div className="space-y-5 py-4 animate-in fade-in duration-300">
            <div className="flex justify-center">
              <div className="bg-sky-100 p-4 rounded-full text-sky-600 shadow-inner">
                <CheckCircle className="w-16 h-16" />
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Cuenta previamente activada
            </h1>

            <p className="text-sm sm:text-base text-gray-600 leading-relaxed max-w-md mx-auto">
              {mensaje}
            </p>

            <div className="pt-4 max-w-xs mx-auto">
              <Button
                text="Ir a Iniciar Sesión"
                variant="primary"
                onClick={() => navigate("/login")}
                className="w-full py-3 font-semibold rounded-lg shadow-md transition-colors"
              />
            </div>
          </div>
        )}

        {estado === "error" && (
          <div className="space-y-5 py-4 animate-in fade-in duration-300">
            <div className="flex justify-center">
              <div className="bg-red-100 p-4 rounded-full text-red-600 shadow-inner">
                <AlertCircle className="w-16 h-16" />
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              No se pudo verificar el correo
            </h1>

            <p className="text-sm sm:text-base text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 max-w-md mx-auto">
              {mensaje}
            </p>

            <p className="text-xs text-gray-500 leading-relaxed max-w-sm mx-auto">
              Por motivos de seguridad, los enlaces de verificación son de un solo uso y caducan después de <strong>15 minutos</strong>.
            </p>

            <div className="space-y-3 pt-4 max-w-xs mx-auto">
              <Button
                text="Ir a Iniciar Sesión"
                variant="primary"
                onClick={() => navigate("/login")}
                className="w-full py-3 font-semibold rounded-lg shadow-md transition-colors"
              />
              <Button
                text="Registrarse de nuevo"
                variant="outline"
                onClick={() => navigate("/registro")}
                className="w-full py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
              />
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-gray-100 text-xs text-gray-500">
          <Link to="/login" className="hover:text-gray-800 transition-colors inline-flex items-center gap-1 font-semibold">
            Volver a la página principal <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

      </div>
    </div>
  );
}

export default ConfirmarRegistro;
