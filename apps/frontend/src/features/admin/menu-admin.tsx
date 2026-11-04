import { useNavigate } from "react-router";
import { Button } from "../../components/atoms/Button/Button";

export function MenuPrincipalAdministracion() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 font-merriweather text-gray-800">

      <main className="max-w mx-auto p-0 space-y-8">
        <div>
          <h1 className="text-[28px] font-bold text-gray-900 font-merriweather mb-3">
            Menú Principal de Administración
          </h1>
          <p className="text-[16px] text-gray-600 max-w leading-relaxed font-merriweather">
            Bienvenido al panel central de Event-Os. Selecciona un módulo para explorar la bitácora de eventos histórica, administrar cuentas y jefaturas, o actualizar el estado de espacios y laboratorios de ESCOM.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-0">
          
          <div className="bg-white p-6 rounded-lg border border-primary shadow-sm flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-gray-900">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-6 h-6 text-[#5c1d33]">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                </svg>
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
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-6 h-6 text-[#5c1d33]">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21" />
                </svg>
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
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-6 h-6 text-[#5c1d33]">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                </svg>
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
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-6 h-6 text-[#5c1d33]">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                </svg>
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
      </main>
    </div>
  );
}

export default MenuPrincipalAdministracion;