import { Button } from "../../components/atoms/Button/Button";
import { Modal } from "../../components/molecules/Modal";
import { useBitacoraGeneral } from "../admin/hooks/useBitacoraGeneral";
import { PageContainer } from "../../components/templates/PageContainer";
import { PageHeader } from "../../components/organisms/PageHeader/PageHeader";
import { SearchField } from "../../components/molecules/SearchField";

export function BitacoraGeneral() {
  const {
    bitacora,
    busqueda,
    setBusqueda,
    loading,
    modalExito,
    handleExportar,
    cerrarModalExito,
  } = useBitacoraGeneral();

  return (
    <PageContainer>
      <div className="space-y-6 text-gray-800">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 xl:max-w-md xl:shrink-0">
            <PageHeader
              title="Bitácora general de movimientos"
              description="Historial cronológico de cambios de estado y registros de eventos"
              back={{ to: "/menu-admin", label: "Volver al menú" }}
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full lg:w-auto">
            <SearchField
              value={busqueda}
              onChange={setBusqueda}
              placeholder="Buscar evento..."
              className="w-full sm:w-80"
            />
            <Button
              text="Exportar"
              type="button"
              variant="primary"
              onClick={handleExportar}
              className="px-6 py-2.5 rounded-lg text-sm shadow transition-colors shrink-0"
            />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-300 shadow-sm p-6 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-300 text-gray-900 text-sm font-bold">
                <th className="py-3 px-4">Evento</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4">Usuario</th>
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Hora</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-gray-500">Cargando registros de bitácora...</td>
                </tr>
              ) : bitacora.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-gray-500">No se encontraron movimientos registrados.</td>
                </tr>
              ) : (
                bitacora.map((item, index) => (
                  <tr key={item.idBitacoraEvento || index} className="border-b border-gray-200 hover:bg-gray-50 text-sm">
                    <td className="py-3 px-4">{item.evento}</td>
                    <td className="py-3 px-4">{item.estado}</td>
                    <td className="py-3 px-4">{item.usuario}</td>
                    <td className="py-3 px-4">{item.fecha}</td>
                    <td className="py-3 px-4">{item.hora}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <div className="text-center">     
          <Modal mostrarModal={modalExito} cerrarModal={cerrarModalExito} titulo="Bitácora exportada correctamente" contenido="">
            <div className="flex justify-end pt-4">
              <Button text="Aceptar" type="button" variant="primary" onClick={cerrarModalExito} className="px-4 py-1.5 text-xs rounded-md shadow"/>
            </div>
          </Modal>
        </div>     
      </div>
    </PageContainer>
  );
}

export default BitacoraGeneral;