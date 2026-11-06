import { Button } from "../../components/atoms/Button/Button";
import { Modal } from "../../components/molecules/Modal";
import { ListaEquiposTable } from "../admin/organism/ListaEquiposTable";
import { useGestionEquipos } from "../admin/hooks/useGestionEquipos";

export function GestionEquipos() {
  const {
    id,
    equipos,
    loading,
    totalEquipos,
    equiposDisponibles,
    equiposFueraDeServicio,
    modalAbierto,
    setModalAbierto,
    modalEspacioAbierto,
    equipoPendiente,
    handleToggleClick,
    handleConfirmarCambio,
    handleConfirmarInhabilitarEspacio,
    handleCancelarInhabilitarEspacio,
    handleVolverAGestionEspacios,
  } = useGestionEquipos();

  return (
    <div className="space-y-6 font-merriweather text-gray-800">

      <div className="mb-2">
        <button onClick={handleVolverAGestionEspacios} className="flex items-center text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors">
          <span className="font-merriweather text-[16px] mr-3">← Volver a Gestion de Espacios</span>
        </button>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Mapa visual de inventario
        </h1>
        <p className="text-[20px] text-gray-600">
          <span className="font-semibold">Laboratorio ID:</span> {id}
        </p>
      </div>

      {loading && <p className="text-sm text-gray-600">Cargando equipos...</p>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
        <div className="space-y-4">
          <p className="text-sm font-medium text-gray-800">
            Selecciona el equipo de cómputo
          </p>

          <div className="bg-white p-5 rounded-md border border-gray-300 shadow-sm space-y-2 text-sm font-merriweather">
            <p><span className="font-semibold">Total de equipos:</span> {totalEquipos}</p>
            <p><span className="font-semibold">Equipos disponibles:</span> {equiposDisponibles}</p>
            <p><span className="font-semibold">Equipos fuera de servicio:</span> {equiposFueraDeServicio}</p>
          </div>
        </div>

        <ListaEquiposTable equipos={equipos} onToggleEquipo={handleToggleClick}/>
      </div>

      <Modal titulo="Advertencia" contenido="" mostrarModal={modalAbierto} cerrarModal={() => setModalAbierto(false)}>
        <div className="space-y-6">
          <p className="text-sm text-gray-700 font-merriweather">
            ¿Estás seguro que quieres {equipoPendiente?.estado ? "inhabilitar" : "habilitar"} el Equipo {equipoPendiente?.numeroEquipo}?
          </p>

          <div className="flex items-center justify-end space-x-3">
            <Button text="Cancelar" type="button" variant="outline" onClick={() => setModalAbierto(false)}
              className="font-merriweather text-sm px-6 py-2.5 rounded-md transition-colors"
            />
            <Button text="Aceptar" type="button" onClick={handleConfirmarCambio}
              className="font-merriweather text-sm px-6 py-2.5 rounded-md transition-colors shadow"
            />
          </div>
        </div>
      </Modal>

      <Modal titulo="Inhabilitación de Laboratorio" contenido="" mostrarModal={modalEspacioAbierto} cerrarModal={handleCancelarInhabilitarEspacio}>
        <div className="space-y-6">
          <p className="text-sm text-gray-700 font-merriweather">
            ¿Estás seguro de inhabilitar el equipo? Al hacerlo, el espacio se inhabilitará y los eventos programados podrían verse afectados.
          </p>

          <div className="flex items-center justify-end space-x-3">
            <Button text="Cancelar" type="button" variant="outline" onClick={handleCancelarInhabilitarEspacio}
              className="font-merriweather text-sm px-6 py-2.5 rounded-md transition-colors"
            />
            <Button text="Aceptar" type="button" onClick={handleConfirmarInhabilitarEspacio}
              className="font-merriweather text-sm px-6 py-2.5 rounded-md transition-colors shadow"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default GestionEquipos;