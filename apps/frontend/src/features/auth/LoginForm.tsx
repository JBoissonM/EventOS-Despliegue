import { useState, useRef } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { useLocation, useNavigate } from "react-router";
import { FieldMessage } from "../../components/atoms/FieldMessage/FieldMessage";
import { Input } from "../../components/atoms/Input/Input";
import { Button } from "../../components/atoms/Button/Button";
import { TextLink } from "../../components/atoms/TextLink/TextLink";
import { FormField } from "../../components/molecules/FormField";
import { PasswordField } from "../../components/molecules/PasswordField";
import { CaptchaField } from "../../components/molecules/CaptchaField";
import { AuthLayout } from "../../components/templates/AuthLayout";
import { API_BASE_URL } from "../../lib/apiClient";
import { getCurrentUserHomePath } from "../../lib/userNavigation";

export function LoginForm() {
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    correo: "",
    contrasena: "",
  });

  const [errors, setErrors] = useState({
    correo: "",
    contrasena: "",
    general: "",
  });

  const [loading, setLoading] = useState(false);
  const [captchaError, setCaptchaError] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const ValidacionContra = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,64}$/;

  const handleCaptchaChange = (token: string | null) => {
    setCaptchaToken(token);
    if (token) setCaptchaError("");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "correo") {
      if (!value.trim()) {
        setErrors((prev) => ({ ...prev, correo: "El correo electrónico es requerido." }));
      } else if (!/\S+@\S+\.\S+/.test(value)) {
        setErrors((prev) => ({ ...prev, correo: "El formato del correo electrónico no es válido." }));
      } else {
        setErrors((prev) => ({ ...prev, correo: "" }));
      }
    }

    if (name === "contrasena") {
      if (!value) {
        setErrors((prev) => ({ ...prev, contrasena: "La contraseña es requerida." }));
      } else if (!ValidacionContra.test(value)) {
        setErrors((prev) => ({
          ...prev,
          contrasena: "La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial.",
        }));
      } else {
        setErrors((prev) => ({ ...prev, contrasena: "" }));
      }
    }
  };  

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors((prev) => ({ ...prev, general: "" }));
    let hasError = false;

    let newCorreoError = "";
    let newContrasenaError = "";

    if (!formData.correo.trim()) {
      newCorreoError = "El correo electrónico es requerido.";
      hasError = true;
    } else if (!/\S+@\S+\.\S+/.test(formData.correo)) {
      newCorreoError = "El formato del correo electrónico no es válido.";
      hasError = true;
    }

    if (!formData.contrasena) {
      newContrasenaError = "La contraseña es requerida.";
      hasError = true;
    } else if (!ValidacionContra.test(formData.contrasena)) {
      newContrasenaError = "La contraseña debe cumplir con los requisitos de seguridad.";
      hasError = true;
    }

    if (!captchaToken) {
      setCaptchaError("Por favor, confirma que no eres un robot.");
      hasError = true;
    }

    if (hasError) {
      setErrors((prev) => ({
        ...prev,
        correo: newCorreoError,
        contrasena: newContrasenaError,
      }));
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          correo: formData.correo,
          contrasena: formData.contrasena,
          captchaToken: captchaToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al iniciar sesión.");
      }

      localStorage.setItem("token", data.access_token);
      localStorage.setItem("usuario", JSON.stringify(data.usuario));

      const returnUrl = (
        location.state as { returnUrl?: unknown } | null
      )?.returnUrl;

      if (
        typeof returnUrl === "string" &&
        /^\/(?:eventos\/[1-9]\d*(?:\/actividades\/[1-9]\d*)?|asistente\/boletos(?:\/[1-9]\d*)?)$/.test(returnUrl)
      ) {
        navigate(returnUrl, { replace: true });
        return;
      }

      navigate(getCurrentUserHomePath() ?? "/login", { replace: true });

    } catch (error: any) {
      setErrors((prev) => ({
        ...prev,
        general: error.message || "Ocurrió un error al conectar con el servidor.",
      }));
      recaptchaRef.current?.reset();
      setCaptchaToken(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Iniciar Sesión" generalError={errors.general}>
      <form onSubmit={handleSubmit} className="space-y-4">
        
        <FormField label="Correo Electrónico" htmlFor="correo" errorMessage={errors.correo}>
          <Input id="correo" type="email" name="correo" placeholder="Ingresar tu correo electrónico" aria-describedby="email-error"
            value={formData.correo}
            onChange={handleChange}
            hasError={!!errors.correo}
          />
          <FieldMessage variant="helper" className="mt-1">
            Usa tu correo institucional (@ipn.mx, @alumno.ipn.mx) o tu cuenta personal. 
          </FieldMessage>
        </FormField>

        <PasswordField id="contrasena" name="contrasena" label="Contraseña" placeholder="●●●●●●●" value={formData.contrasena} onChange={handleChange} error={errors.contrasena}/>

        <CaptchaField recaptchaRef={recaptchaRef} onChange={handleCaptchaChange} error={captchaError}
          sitekey="6LddCvktAAAAAM980VTf7Y1lBBjUbjKEIOqMEXBi"
        />

        <Button fullWidth size="md" variant="primary" className="mt-2" type="submit" text="Iniciar Sesión" loadingText="Iniciando sesión..." loading={loading}/>

        <div className="mt-1 text-center">
          <TextLink to="/registro" state={location.state} className="text-eventos-secondary hover:text-eventos-primary font-merriweather font-semibold text-[16px]">
            ¿No tienes cuenta? Regístrate
          </TextLink>
        </div>
      </form>
    </AuthLayout>
  );
}

export default LoginForm;