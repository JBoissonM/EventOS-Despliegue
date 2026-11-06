import { Button } from "../../components/atoms/Button/Button";
import { Input } from "../../components/atoms/Input/Input";
import { Modal } from "../../components/molecules/Modal";
import { useBitacoraGeneral } from "../admin/hooks/useBitacoraGeneral";
import { Search } from "lucide-react";

export function BitacoraGeneral() {
  const {
    bitacora,
    busqueda,
    setBusqueda,
    loading,
    modalExito,
    handleBuscar,
    handleExportar,
    handleVolverAlMenu,
    cerrarModalExito,
  } = useBitacoraGeneral();

  return (
    <div className="space-y-6 font-merriweather text-gray-800 w-full p-0">
      <div className="mb-2">
        <button onClick={handleVolverAlMenu} className="flex items-center text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors">
          <span className="font-merriweather text-[16px] mr-3">← Volver al menú</span>
        </button>
      </div>

      <h1 className="text-[32px] font-bold text-gray-900 font-merriweather">
        Bitácora general de movimientos
      </h1>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <form onSubmit={handleBuscar} className="w-full md:w-96">
          <div className="flex items-center border border-gray-300 rounded-md bg-white px-3 py-2 shadow-sm focus-within:ring-1 focus-within:ring-[#5c1d33]">
            <Input type="text" placeholder="Buscar evento" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="border-none p-0 focus:ring-0 text-sm w-full outline-none bg-transparent"/>
            <button type="submit" className="text-gray-500 hover:text-gray-700 ml-2 focus:outline-none shrink-0" aria-label="Buscar">
              <Search className="w-5 h-5" />
            </button>
          </div>
        </form>

        <Button text="Exportar" type="button" variant="primary" onClick={handleExportar} className="px-6 py-2.5 rounded-md text-sm shadow transition-colors"/>
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
  );
}

export default BitacoraGeneral;