import { Button } from "../../components/atoms/Button/Button";
import { EspacioCard } from "../../components/organisms/EspacioCard/EspacioCard";
import { Modal } from "../../components/molecules/Modal";
import { useGestionEspacios } from "../admin/hooks/useGestionEspacios";

export function GestionEspacios() {
  const {
    espacios,
    loading,
    error,
    modalAbierto,
    setModalAbierto,
    isInhabilitando,
    handlePreToggle,
    handleConfirmToggle,
    handleVolverAlMenu,
    handleGestionarEquipos,
  } = useGestionEspacios();

  return (
    <div className="space-y-6 font-merriweather text-gray-800">
      
      <div className="mb-2">
        <button onClick={handleVolverAlMenu} className="flex items-center text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors">
          <span className="font-merriweather text-[16px] mr-3">← Volver al menú</span>
        </button>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Gestión de espacios físicos
        </h1>
        <p className="text-sm text-gray-600">
          Administra los recintos de ESCOM
        </p>
      </div>

      {loading && <p className="text-sm text-gray-600">Cargando espacios...</p>}
      {error && <p className="text-sm text-eventos-error">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        {!loading && espacios.map((espacio) => (
          <EspacioCard 
            key={espacio.idRecinto} 
            espacio={espacio} 
            onToggleEstado={handlePreToggle} 
            onGestionarEquipos={handleGestionarEquipos}
          />
        ))}
      </div>

      <Modal titulo={isInhabilitando ? "Inhabilitar espacio físico" : "Habilitar espacio físico"} contenido="" mostrarModal={modalAbierto} cerrarModal={() => setModalAbierto(false)}>
        <div className="space-y-4 font-merriweather text-sm text-gray-700">
          <p>
            {isInhabilitando 
              ? "¿Estas seguro de inhabilitar este espacio físico? Los eventos programados podrían verse afectados."
              : "El espacio volverá a estar disponible para la programación de eventos."}
          </p>
          <div className="flex justify-end space-x-3 pt-2">
            <Button text="Cancelar" variant="outline" type="button" onClick={() => setModalAbierto(false)} className="px-5 py-2 rounded-md transition-colors shadow"/>
            <Button text={isInhabilitando ? "Inhabilitar" : "Habilitar"} type="button" onClick={handleConfirmToggle} className={`px-5 py-2 rounded-md transition-colors shadow`}/>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default GestionEspacios;