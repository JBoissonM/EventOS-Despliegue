import { useNavigate } from "react-router";
import { PageContainer } from "../../components/templates/PageContainer";
import { PageHeader } from "../../components/organisms/PageHeader/PageHeader";
import { Button } from "../../components/atoms/Button/Button";
import { Users, Building2, CalendarDays, UserCheck } from "lucide-react";

export function MenuPrincipalAdministracion() {
  const navigate = useNavigate();

  return (
    <PageContainer>
      <div className="space-y-8 font-merriweather text-gray-800">
        <PageHeader
          title="Menú Principal de Administración"
          description="Bienvenido al panel central de Event-Os. Selecciona un módulo para explorar la bitácora de eventos histórica, administrar cuentas y jefaturas, o actualizar el estado de espacios y laboratorios de ESCOM."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-0">
          
          <div className="bg-white p-6 rounded-lg border border-primary shadow-sm flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-gray-900">
                <Users className="w-6 h-6 text-[#000000]" />
                <h2 className="text-xl font-bold font-merriweather text-gray-900">Gestionar Cuentas de Usuario</h2>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed font-merriweather">
                Consulta el directorio de cuentas registradas, filtra por rol o última conexión y habilita o inhabilita su acceso al sistema.
              </p>
            </div>
            <div>
              <Button text="Gestionar cuentas" type="button" onClick={() => navigate("/admin/gestion-usuarios")} variant="primary" className="px-5 py-2 text-xs rounded-md shadow transition-colors font-merriweather"/>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-primary shadow-sm flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-gray-900">
                <Building2 className="w-6 h-6 text-[#000000]" />
                <h2 className="text-xl font-bold font-merriweather text-gray-900">Gestión de Espacios Físicos</h2>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed font-merriweather">
                Actualiza el estado operativo de los recintos de ESCOM o administra el inventario de equipos en laboratorios.
              </p>
            </div>
            <div>
              <Button text="Gestionar Espacios" type="button" onClick={() => navigate("/gestion-espacios")} variant="primary" className="px-5 py-2 text-xs rounded-md shadow transition-colors font-merriweather"/>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-primary shadow-sm flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-gray-900">
                <CalendarDays className="w-6 h-6 text-[#000000]" />
                <h2 className="text-xl font-bold font-merriweather text-gray-900">Bitácora Histórica de Eventos</h2>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed font-merriweather">
                Revisa el registro cronológico de eventos y movimientos en la plataforma y expórtalo en formato PDF.
              </p>
            </div>
            <div>
              <Button text="Consultar Bitacora" type="button" onClick={() => navigate("/admin/bitacora")} className="px-5 py-2 text-xs rounded-md shadow transition-colors font-merriweather"/>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-primary shadow-sm flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-gray-900">
                <UserCheck className="w-6 h-6 text-[#000000]" />
                <h2 className="text-xl font-bold font-merriweather text-gray-900">Asignación de Jefes de Departamento</h2>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed font-merriweather">
                Busca cuentas activas por correo institucional para otorgar o revocar permisos de Jefatura de Departamento.
              </p>
            </div>
            <div>
              <Button text="Asignar Jefes" type="button" variant="primary" onClick={() => navigate("/admin/jefe-departamento")} className="px-5 py-2 text-xs rounded-md shadow transition-colors font-merriweather"/>
            </div>
          </div>

        </div>
      </div>
    </PageContainer>
  );
}

export default MenuPrincipalAdministracion;