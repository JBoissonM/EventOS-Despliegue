import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { Button } from "../../components/atoms/Button/Button";
import { PageContainer } from "../../components/templates/PageContainer";
import { PageHeader } from "../../components/organisms/PageHeader/PageHeader";
import { SearchField } from "../../components/molecules/SearchField";
import { Table, type Columna } from "../../components/organisms/Table/Table";
import { API_BASE_URL } from "../../lib/apiClient";
import type { SolicitudVerificacionItem } from "@eventos/shared";
import { UserCheck, Clock } from "lucide-react";

export function ListaVerificaciones() {
  const navigate = useNavigate();
  const [solicitudes, setSolicitudes] = useState<SolicitudVerificacionItem[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getToken = () => {
    const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
    return usuario.token || localStorage.getItem("token") || "";
  };

  const cargarSolicitudes = useCallback(async (termino?: string) => {
    setCargando(true);
    setError(null);
    try {
      const url = new URL(`${API_BASE_URL}/usuarios/verificaciones/pendientes`);
      if (termino && termino.trim() !== "") {
        url.searchParams.set("buscar", termino.trim());
      }

      const res = await fetch(url.toString(), {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!res.ok) {
        throw new Error("No se pudieron cargar las solicitudes de verificación.");
      }

      const data = await res.json();
      setSolicitudes(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || "Error al conectar con el servidor.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarSolicitudes();
  }, [cargarSolicitudes]);

  const solicitudesFiltradas = solicitudes.filter((item) => {
    if (!busqueda.trim()) return true;
    const term = busqueda.toLowerCase().trim();
    return (
      item.nombre.toLowerCase().includes(term) ||
      item.perfilSolicita.toLowerCase().includes(term) ||
      item.correo.toLowerCase().includes(term) ||
      (item.numeroBoleta && item.numeroBoleta.toLowerCase().includes(term))
    );
  });

  const columnas: Columna<SolicitudVerificacionItem>[] = [
    {
      id: "nombre",
      encabezado: "Nombre del solicitante",
      render: (item) => (
        <span className="font-merriweather font-medium text-gray-900 text-base">
          {item.nombre}
        </span>
      ),
      className: "px-6 py-4 text-center font-merriweather text-base font-medium text-gray-900",
    },
    {
      id: "rol",
      encabezado: "Rol",
      render: (item) => (
        <span className="font-merriweather text-gray-800 text-base">
          {item.perfilSolicita}
        </span>
      ),
      className: "px-6 py-4 text-center font-merriweather text-base font-medium text-gray-900",
    },
    {
      id: "solicitud",
      encabezado: "Solicitud",
      render: (item) => (
        <Button
          text="Ver solicitud"
          type="button"
          onClick={() => navigate(`/subdireccion/verificaciones/${item.idVerificacion}`)}
          className="bg-[#5F1B36] hover:bg-eventos-action-hover text-white px-5 py-2 rounded-lg text-sm shadow-sm transition-colors cursor-pointer"
        />
      ),
      className: "px-6 py-4 text-center font-merriweather text-base font-medium text-gray-900",
    },
  ];

  return (
    <PageContainer>
      <section className="space-y-6 font-merriweather">
        <div className="mb-6 flex flex-col gap-6 lg:mb-8 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 xl:max-w-sm xl:shrink-0">
            <PageHeader
              title="Solicitudes de verificación"
              description="Revisa y evalúa las solicitudes pendientes de acreditación de identidad"
              back={{ to: "/subdireccion/menu-principal", label: "Volver al menú" }}
            />
          </div>

          <div className="w-full min-w-0 space-y-3 xl:max-w-md">
            <SearchField
              value={busqueda}
              onChange={setBusqueda}
              placeholder="Buscar por rol o solicitante..."
            />
          </div>
        </div>

        {cargando && (
          <div className="flex min-h-87.5 items-center justify-center">
            <div className="flex items-center gap-3 text-gray-600 font-merriweather">
              <Clock className="w-6 h-6 animate-spin text-[#5F1B36]" />
              <span>Cargando solicitudes de verificación...</span>
            </div>
          </div>
        )}

        {error && !cargando && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg font-merriweather">
            {error}
          </div>
        )}

        {!cargando && !error && solicitudesFiltradas.length === 0 && (
          <div className="flex min-h-87.5 flex-col items-center justify-center text-center space-y-3 bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
            <UserCheck className="w-16 h-16 text-gray-400" />
            <p className="font-merriweather text-xl font-semibold text-gray-800">
              {busqueda.trim()
                ? "No se encontraron solicitudes que coincidan con la búsqueda."
                : "No hay solicitudes de verificación de cuentas pendientes."}
            </p>
            <p className="text-sm text-gray-500 max-w-md">
              {busqueda.trim()
                ? "Intenta buscando por otro nombre o rol de solicitante."
                : "Las nuevas solicitudes de alumnos, docentes, empresas o externos aparecerán aquí para su validación."}
            </p>
          </div>
        )}

        {!cargando && !error && solicitudesFiltradas.length > 0 && (
          <div className="mx-auto w-full overflow-x-auto shadow-sm rounded-lg border border-gray-200 bg-white">
            <Table
              columnas={columnas}
              filas={solicitudesFiltradas}
              obtenerClave={(item) => item.idVerificacion}
              className="table-auto min-w-full text-center [&_tbody_tr]:h-20 [&_thead_tr]:h-17.5 [&_thead_tr]:border-b [&_thead_tr]:border-gray-300 [&_tbody_tr]:border-b [&_tbody_tr]:border-gray-200"
            />
          </div>
        )}
      </section>
    </PageContainer>
  );
}

export default ListaVerificaciones;
