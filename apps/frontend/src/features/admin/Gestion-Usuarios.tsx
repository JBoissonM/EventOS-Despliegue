import { Button } from "../../components/atoms/Button/Button";
import { useGestionUsuarios } from "../admin/hooks/useGestionUsuarios";
import { PageContainer } from "../../components/templates/PageContainer";
import { PageHeader } from "../../components/organisms/PageHeader/PageHeader";
import { SearchField } from "../../components/molecules/SearchField";
import { FilterDropdown, type FilterOption } from "../../components/molecules/FilterDropdown";

const rolOptions: FilterOption[] = [
  { value: "Estudiante", label: "Estudiante" },
  { value: "Docente", label: "Docente" },
  { value: "Externo", label: "Externo" },
  { value: "Empresa", label: "Empresa" },
  { value: "No verificado", label: "No verificado" },
  { value: "Activo", label: "Activo" },
  { value: "Inactivo", label: "Inactivo" },
];

export function GestionUsuarios() {
  const {
    usuarios,
    filtroRol,
    setFiltroRol,
    busqueda,
    setBusqueda,
    loading,
    modalConfirmacion,
    modalExito,
    usuarioSeleccionado,
    mensajeExito,
    abrirModalCambioEstatus,
    cerrarModalConfirmacion,
    cerrarModalExito,
    confirmarCambioEstatus,
  } = useGestionUsuarios();

  return (
    <PageContainer>
      <div className="space-y-6 text-gray-800">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 xl:max-w-md xl:shrink-0">
            <PageHeader
              title="Cuentas del sistema"
              description="Directorio de usuarios registrados, roles y control de acceso"
              back={{ to: "/menu-admin", label: "Volver al menú" }}
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full lg:w-auto">
            <SearchField
              value={busqueda}
              onChange={setBusqueda}
              placeholder="Buscar por nombre o correo..."
              className="w-full sm:w-80"
            />
            <div className="w-full sm:w-52">
              <FilterDropdown
                label="Rol"
                allLabel="Todos los roles"
                allValue="Todos"
                value={filtroRol}
                options={rolOptions}
                onChange={setFiltroRol}
              />
            </div>
          </div>
        </div>

      <div className="bg-white rounded-lg border border-gray-300 shadow-sm p-6 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-300 text-gray-900 text-sm font-bold">
              <th className="py-3 px-4">Nombre</th>
              <th className="py-3 px-4">Correo</th>
              <th className="py-3 px-4">Rol</th>
              <th className="py-3 px-4 text-center">Estado</th>
              <th className="py-3 px-4 text-center">Acción</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-6 text-gray-500">Cargando cuentas...</td>
              </tr>
            ) : usuarios.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-6 text-gray-500">No se encontraron registros con este criterio.</td>
              </tr>
            ) : (
              usuarios.map((usuario) => (
                <tr key={usuario.idUsuario} className="border-b border-gray-200 hover:bg-gray-50 text-sm">
                  <td className="py-3 px-4">{usuario.nombre}</td>
                  <td className="py-3 px-4">{usuario.correo}</td>
                  <td className="py-3 px-4">{usuario.rol}</td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold ${
                        usuario.estatus
                          ? "bg-green-100 text-green-800 border border-green-200"
                          : "bg-red-100 text-red-800 border border-red-200"
                      }`}
                    >
                      {usuario.estatus ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Button
                      text={usuario.estatus ? "Inhabilitar" : "Habilitar"}
                      type="button"
                      variant={usuario.estatus ? "outline" : "primary"}
                      onClick={() => abrirModalCambioEstatus(usuario)}
                      className="text-xs px-4 py-1.5 rounded-md shadow-sm"
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalConfirmacion && usuarioSeleccionado && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-6 font-merriweather animate-fadeIn">
            <h2 className="text-xl font-bold text-gray-900">
              {usuarioSeleccionado.estatus
                ? "¿Inhabilitar cuenta de usuario?"
                : "¿Habilitar cuenta de usuario?"}
            </h2>
            <p className="text-sm text-gray-700">
              ¿Desea {usuarioSeleccionado.estatus ? "inhabilitar" : "habilitar"} al usuario{" "}
              <span className="font-semibold">{usuarioSeleccionado.nombre}</span>?
            </p>
            <div className="flex justify-end space-x-3 pt-2">
              <Button
                text="Cancelar"
                type="button"
                variant="outline"
                onClick={cerrarModalConfirmacion}
                className="px-4 py-2 text-xs rounded-md"
              />
              <Button
                text="Aceptar"
                type="button"
                variant="primary"
                onClick={confirmarCambioEstatus}
                className="px-4 py-2 text-xs rounded-md"
              />
            </div>
          </div>
        </div>
      )}

      {modalExito && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-6 font-merriweather animate-fadeIn">
            <h2 className="text-xl font-bold text-gray-900">
              Estado de cuenta actualizado
            </h2>
            <p className="text-sm text-gray-700">{mensajeExito}</p>
            <div className="flex justify-end pt-2">
              <Button
                text="Aceptar"
                type="button"
                variant="primary"
                onClick={cerrarModalExito}
                className="px-5 py-2 text-xs rounded-md"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  </PageContainer>
  );
}

export default GestionUsuarios;