import { Input } from "../../components/atoms/Input/Input";
import { Button } from "../../components/atoms/Button/Button";
import { FieldMessage } from "../../components/atoms/FieldMessage/FieldMessage";
import { TextLink } from "../../components/atoms/TextLink/TextLink";
import { FormField } from "../../components/molecules/FormField";
import { PasswordField } from "../../components/molecules/PasswordField";
import { Modal } from "../../components/molecules/Modal";
import { useRegistro } from "../auth/hooks/useRegistro";

export function Registro() {
  const {
    formData,
    errors,
    loading,
    loginPath,
    modalExitoAbierto,
    modalIncompletosAbierto,
    handleChange,
    handleSubmit,
    handleCerrarModalExito,
    handleCerrarModalIncompletos,
  } = useRegistro();

  return (
    <div className="flex min-h-[calc(100vh-160px)] items-center justify-center p-4">
      <div className="w-full max-w-2xl rounded-lg bg-white p-8 shadow-sm border border-gray-100">
        
        <h1 className="mb-8 text-center text-3xl font-merriweather font-bold text-[36px] text-gray-900">
          Registro
        </h1>

        {errors.general && (
          <div className="mb-4 rounded bg-red-50 p-3 text-center text-sm text-eventos-error border border-red-200">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4 font-merriweather font-regular text-[16px]">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 items-start">
              <h2 className="mb-4 text-3xl font-merriweather font-medium text-[20px] text-gray-900">
                Datos de la Cuenta
              </h2>
              <h2 className="mb-1 text-3xl font-merriweather font-medium text-[20px] text-gray-900">
                Datos Personales
              </h2>
            </div>

            <div className="-mb-6 grid grid-cols-1 gap-6 md:grid-cols-2 items-start">
              <FormField label="Correo Electrónico" htmlFor="correo">
                <Input id="correo" name="correo" type="email" placeholder="Ingresa tu correo electrónico"  value={formData.correo} onChange={handleChange} hasError={!!errors.correo} aria-describedby="email-error"/>
                <div className="min-h-10.5 mt-1">
                  {errors.correo ? (
                    <p className="text-eventos-error text-xs font-merriweather">{errors.correo}</p>
                  ) : (
                    <FieldMessage variant="helper">
                      Usa tu correo institucional (@ipn.mx, @alumno.ipn.mx) o tu cuenta personal. 
                    </FieldMessage>
                  )}
                </div>
              </FormField>

              <FormField label="Nombre(s)" htmlFor="nombre">
                <Input id="nombre" name="nombre" type="text" placeholder="Ingresa tu nombre" value={formData.nombre} onChange={handleChange} hasError={!!errors.nombre}/>
                <div className="min-h-10.5 mt-1">
                  {errors.nombre && (
                    <p className="text-eventos-error text-xs font-merriweather">{errors.nombre}</p>
                  )}
                </div>
              </FormField>
            </div>

            <div className="-mb-3 grid grid-cols-1 gap-6 md:grid-cols-2 items-start">
              <div>
                <PasswordField id="contrasena" name="contrasena" label="Contraseña" placeholder="Ejemplo01!" value={formData.contrasena} onChange={handleChange} error={errors.contrasena}/>
                <div className="mt-2">
                  {!errors.contrasena && (
                    <FieldMessage variant="helper">
                      Tu contraseña debe tener entre 8 y 64 caracteres, y contener al menos: una mayúscula, una minúscula, un número y un carácter especial (ej. @, $, !, %, *, ?, &, _, -).
                    </FieldMessage>
                  )}
                </div>
              </div>

              <FormField label="Apellido Paterno" htmlFor="apellidoPa">
                <Input id="apellidoPa" name="apellidoPa" type="text" placeholder="Ingresa tu apellido paterno" value={formData.apellidoPa} onChange={handleChange} hasError={!!errors.apellidoPa}/>
                <div className="min-h-16 mt-2">
                  {errors.apellidoPa && (
                    <p className="text-eventos-error text-xs font-merriweather">{errors.apellidoPa}</p>
                  )}
                </div>
              </FormField>
            </div>

            <div className="-mb-4 grid grid-cols-1 gap-6 md:grid-cols-2 items-start">
              <PasswordField id="confirmarContrasena" name="confirmarContrasena" label="Confirmar contraseña" placeholder="Ejemplo01!" value={formData.confirmarContrasena} onChange={handleChange} error={errors.confirmarContrasena}/>
                <FormField label="Apellido Materno" htmlFor="apellidoMaterno">
                  <Input id="apellidoMaterno" name="apellidoMaterno" placeholder="Ingresa tu apellido materno" type="text" value={formData.apellidoMaterno} onChange={handleChange} hasError={!!errors.apellidoPa}/>
                    {errors.apellidoMaterno && (
                      <p className="text-eventos-error text-xs font-merriweather">{errors.apellidoMaterno}</p>
                    )}
                </FormField>
            </div>
          </div>

          <div className="flex justify-center pt-2">
            <Button type="submit" text="Registrar" loadingText="Registrando..." loading={loading} fullWidth size="md" variant="primary" className="max-w-xs"/>
          </div>

          <div className="mt-4 text-center">
            <TextLink to={loginPath} className="text-sky-500 font-merriweather font-semibold text-[16px] hover:text-sky-600">
              ¿Ya tienes cuenta? Inicia sesión
            </TextLink>
          </div>
        </form>
      </div>

      <Modal titulo="¡Registro exitoso!" contenido="Tu cuenta ha sido creada correctamente. Ya puedes iniciar sesión en la plataforma." mostrarModal={modalExitoAbierto} cerrarModal={handleCerrarModalExito}>
        <div className="flex justify-end pt-4">
          <Button text="Aceptar" type="button" onClick={handleCerrarModalExito}
            className="font-merriweather text-sm px-6 py-2.5 rounded-md transition-colors shadow"
          />
        </div>
      </Modal>

      <Modal titulo="Campos obligatorios incompletos" contenido="" mostrarModal={modalIncompletosAbierto} cerrarModal={handleCerrarModalIncompletos}>
        <div className="space-y-4 font-merriweather text-sm text-gray-700">
          <p> Por favor completa todos los campos obligatorios resaltados para continuar.</p>
          <div className="flex justify-end pt-2">
            <Button text="Cerrar" type="button" onClick={handleCerrarModalIncompletos} className="px-6 py-2 rounded-md transition-colors shadow"/>
          </div>
        </div>
      </Modal>

    </div>
  );
}

export default Registro;