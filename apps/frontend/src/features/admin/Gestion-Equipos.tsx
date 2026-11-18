import { PageContainer } from "../../components/templates/PageContainer";
import { PageHeader } from "../../components/organisms/PageHeader/PageHeader";
import { Button } from "../../components/atoms/Button/Button";
import { Modal } from "../../components/molecules/Modal";
import { ListaEquiposTable } from "../admin/organism/ListaEquiposTable";
import { useGestionEquipos } from "../admin/hooks/useGestionEquipos";

export function GestionEquipos() {
  const {
    id,
    nombre,
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
  } = useGestionEquipos();

  return (
    <PageContainer>
      <div className="space-y-6 font-merriweather text-gray-800">
        <PageHeader
          title="Mapa visual de inventario"
          description={`${nombre}`}
          back={{ to: "/gestion-espacios", label: "Volver a Gestión de Espacios" }}
        />

        {loading && <p className="text-sm text-gray-600">Cargando equipos...</p>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4 items-start">
          <div className="space-y-4 lg:col-span-1">
            <p className="text-sm font-medium text-gray-800">
              Selecciona el equipo de cómputo
            </p>

            <div className="bg-white p-5 rounded-md border border-gray-300 shadow-sm space-y-2 text-sm font-merriweather">
              <p><span className="font-semibold">Total de equipos:</span> {totalEquipos}</p>
              <p><span className="font-semibold">Equipos disponibles:</span> {equiposDisponibles}</p>
              <p><span className="font-semibold">Equipos fuera de servicio:</span> {equiposFueraDeServicio}</p>
            </div>
          </div>

          <div className="lg:col-span-2  h-1 w-full">
            <ListaEquiposTable equipos={equipos} onToggleEquipo={handleToggleClick} />
          </div>
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
    </PageContainer>
  );
}

export default GestionEquipos;