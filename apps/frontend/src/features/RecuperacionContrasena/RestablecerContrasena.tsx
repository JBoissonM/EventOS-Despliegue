import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Button } from "../../components/atoms/Button/Button";
import { PasswordField } from "../../components/molecules/PasswordField";
import { AuthLayout } from "../../components/templates/AuthLayout";
import { Modal } from "../../components/molecules/Modal";

export function RestablecerContrasena() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [validandoToken, setValidandoToken] = useState(true);
  const [tokenValido, setTokenValido] = useState(false);
  const [errorToken, setErrorToken] = useState("");

  const [formData, setFormData] = useState({
    nuevaContrasena: "",
    confirmarContrasena: "",
  });

  const [errors, setErrors] = useState({
    nuevaContrasena: "",
    confirmarContrasena: "",
    general: "",
  });

  const [loading, setLoading] = useState(false);
  const [modalExitoAbierto, setModalExitoAbierto] = useState(false);

  const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,64}$/;

  useEffect(() => {
    const validarToken = async () => {
      if (!token) {
        setErrorToken("El enlace de recuperación es inválido o no existe.");
        setValidandoToken(false);
        return;
      }

      try {
        const response = await fetch(`http://localhost:3000/api/auth/restablecer-contrasena/validar?token=${encodeURIComponent(token)}`);
        const data = await response.json();

        if (!response.ok || !data.valido) {
          throw new Error(data.message || "El enlace de recuperación es inválido, ya fue utilizado o ha expirado.");
        }

        setTokenValido(true);
      } catch (err: any) {
        setErrorToken(err.message || "El enlace de recuperación ha expirado.");
      } finally {
        setValidandoToken(false);
      }
    };

    validarToken();
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "nuevaContrasena") {
      if (!value) {
        setErrors((prev) => ({ ...prev, nuevaContrasena: "La contraseña es requerida." }));
      } else if (!PASSWORD_REGEX.test(value)) {
        setErrors((prev) => ({
          ...prev,
          nuevaContrasena: "La contraseña debe tener entre 8 y 64 caracteres, e incluir al menos: una mayúscula, una minúscula, un número y un carácter especial (ej. @, $, !, %, *, ?, &, _, -).",
        }));
      } else {
        setErrors((prev) => ({ ...prev, nuevaContrasena: "" }));
      }
    }

    if (name === "confirmarContrasena") {
      if (!value) {
        setErrors((prev) => ({ ...prev, confirmarContrasena: "Confirma tu contraseña." }));
      } else if (value !== formData.nuevaContrasena) {
        setErrors((prev) => ({ ...prev, confirmarContrasena: "Las contraseñas ingresadas no coinciden." }));
      } else {
        setErrors((prev) => ({ ...prev, confirmarContrasena: "" }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({ nuevaContrasena: "", confirmarContrasena: "", general: "" });

    if (!formData.nuevaContrasena || !formData.confirmarContrasena) {
      setErrors((prev) => ({ ...prev, general: "Todos los campos son obligatorios." }));
      return;
    }

    if (!PASSWORD_REGEX.test(formData.nuevaContrasena)) {
      setErrors((prev) => ({
        ...prev,
        nuevaContrasena: "La contraseña debe tener entre 8 y 64 caracteres, e incluir al menos: una mayúscula, una minúscula, un número y un carácter especial (ej. @, $, !, %, *, ?, &, _, -).",
      }));
      return;
    }

    if (formData.nuevaContrasena !== formData.confirmarContrasena) {
      setErrors((prev) => ({ ...prev, confirmarContrasena: "Las contraseñas ingresadas no coinciden." }));
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:3000/api/auth/restablecer-contrasena", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          nuevaContrasena: formData.nuevaContrasena,
          confirmarContrasena: formData.confirmarContrasena,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al restablecer la contraseña.");
      }

      setModalExitoAbierto(true);
    } catch (err: any) {
      setErrors((prev) => ({ ...prev, general: err.message || "Error al conectar con el servidor." }));
    } finally {
      setLoading(false);
    }
  };

  if (validandoToken) {
    return (
      <AuthLayout title="Restablecer Contraseña">
        <div className="text-center py-12 font-merriweather text-gray-600">
          Validando enlace de recuperación...
        </div>
      </AuthLayout>
    );
  }

  if (!tokenValido) {
    return (
      <AuthLayout title="Enlace inválido o expirado" generalError={errorToken}>
        <div className="space-y-6 text-center font-merriweather">
          <p className="text-sm text-gray-600">
            El enlace que estás utilizando ya expiró, fue utilizado previamente o no es válido.
          </p>
          <Button
            text="Solicitar nuevo enlace"
            variant="primary"
            onClick={() => navigate("/recuperar-contrasena")}
            className="w-full py-2.5 rounded-md shadow"
          />
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Restablecer Contraseña" generalError={errors.general}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-gray-600 font-merriweather mb-2">
          Ingresa tu nueva contraseña cumpliendo con los requisitos de seguridad.
        </p>

        <PasswordField id="nuevaContrasena" name="nuevaContrasena" label="Nueva contraseña" placeholder="Ejemplo01!" value={formData.nuevaContrasena} onChange={handleChange} error={errors.nuevaContrasena}/>

        <div className="-mt-2"> 
            <PasswordField id="confirmarContrasena" name="confirmarContrasena" label="Confirmar nueva contraseña" placeholder="Ejemplo01!" value={formData.confirmarContrasena} onChange={handleChange} error={errors.confirmarContrasena}/>
        </div>

        <Button fullWidth size="md" variant="primary" className="mt-4" type="submit" text="Restablecer contraseña" loadingText="Guardando..." loading={loading}/>
      </form>

      <Modal
        titulo="¡Contraseña restablecida!"
        contenido="Tu contraseña ha sido actualizada exitosamente. Ya puedes iniciar sesión con tus nuevas credenciales."
        mostrarModal={modalExitoAbierto}
        cerrarModal={() => {
          setModalExitoAbierto(false);
          navigate("/login");
        }}
      >
        <div className="flex justify-end pt-4">
          <Button text="Ir a Iniciar Sesión" type="button" variant="primary" className="px-6 py-2 rounded-md shadow"
            onClick={() => {
              setModalExitoAbierto(false);
              navigate("/login");
            }}/>
        </div>
      </Modal>
    </AuthLayout>
  );
}

export default RestablecerContrasena;