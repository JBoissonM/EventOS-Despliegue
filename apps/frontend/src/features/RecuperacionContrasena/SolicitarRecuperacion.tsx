import { useState } from "react";
import { useNavigate } from "react-router";
import { Input } from "../../components/atoms/Input/Input";
import { Button } from "../../components/atoms/Button/Button";
import { TextLink } from "../../components/atoms/TextLink/TextLink";
import { FormField } from "../../components/molecules/FormField";
import { AuthLayout } from "../../components/templates/AuthLayout";
import { Modal } from "../../components/molecules/Modal";

export function SolicitarRecuperacion() {
  const navigate = useNavigate();
  const [correo, setCorreo] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalExitoAbierto, setModalExitoAbierto] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!correo.trim()) {
      setError("Por favor, ingresa tu correo electrónico.");
      return;
    } else if (!/\S+@\S+\.\S+/.test(correo)) {
      setError("Ingresa un correo electrónico válido.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:3000/api/auth/recuperar-contrasena", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ correo }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al solicitar la recuperación.");
      }

      setModalExitoAbierto(true);
    } catch (err: any) {
      setError(err.message || "Error al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Recuperar Contraseña" generalError={error}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <p className="text-sm text-gray-600 font-merriweather">
          Ingresa tu correo electrónico registrado y te enviaremos un enlace para restablecer tu contraseña.
        </p>

        <FormField label="Correo Electrónico" htmlFor="correo">
          <Input id="correo" type="email" name="correo" placeholder="Ingresa tu correo electrónico" value={correo} onChange={(e) => setCorreo(e.target.value)} hasError={!!error}/>
        </FormField>

        <Button fullWidth size="md" variant="primary" type="submit" text="Enviar enlace" loadingText="Enviando..." loading={loading}/>

        <div className="mt-4 text-center">
          <TextLink to="/login" className="text-sky-500 hover:text-sky-600 font-merriweather font-semibold text-[16px]">
            ← Volver a Iniciar Sesión
          </TextLink>
        </div>
      </form>

      <Modal
        titulo="Correo enviado"
        contenido="Si el correo electrónico se encuentra registrado, recibirás un enlace de recuperación en los próximos minutos."
        mostrarModal={modalExitoAbierto}
        cerrarModal={() => {
          setModalExitoAbierto(false);
          navigate("/login");
        }}
      >
        <div className="flex justify-end pt-4">
          <Button
            text="Aceptar"
            type="button"
            variant="primary"
            onClick={() => {
              setModalExitoAbierto(false);
              navigate("/login");
            }}
            className="px-6 py-2 rounded-md shadow"
          />
        </div>
      </Modal>
    </AuthLayout>
  );
}

export default SolicitarRecuperacion;