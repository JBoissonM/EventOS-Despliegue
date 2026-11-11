import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router";
import { API_BASE_URL } from "../../../lib/apiClient";

export interface Equipo {
  idEstadoEquipo: number;
  numeroEquipo: number;
  estado: boolean;
  idRecinto: number;
}

export function useGestionEquipos() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalEspacioAbierto, setModalEspacioAbierto] = useState(false);
  const [equipoPendiente, setEquipoPendiente] = useState<Equipo | null>(null);

  const getToken = () => {
    const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
    return usuario.token || localStorage.getItem("token") || "";
  };

  const fetchEquipos = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/espacios/${id}/equipos`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error("No se pudieron cargar los equipos de este laboratorio.");
      }

      const data = await response.json();
      setEquipos(data);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchEquipos();
  }, [fetchEquipos]);

  const totalEquipos = equipos.length;
  const equiposDisponibles = equipos.filter((e) => e.estado).length;
  const equiposFueraDeServicio = totalEquipos - equiposDisponibles;

  const handleToggleClick = (equipo: Equipo) => {
    setEquipoPendiente(equipo);
    setModalAbierto(true);
  };

  const handleConfirmarCambio = async () => {
    if (!equipoPendiente || !id) return;

    const nuevoEstado = !equipoPendiente.estado;
    const isDesactivando = equipoPendiente.estado === true && nuevoEstado === false;
    const equiposActivosCount = equipos.filter((e) => e.estado).length;
    const esUltimoActivo = isDesactivando && equiposActivosCount === 1;

    if (esUltimoActivo) {
      setModalAbierto(false);
      setModalEspacioAbierto(true);
      return; 
    }

    try {
      const response = await fetch(`${API_BASE_URL}/espacios/${id}/equipos/${equipoPendiente.idEstadoEquipo}/estado`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ estado: nuevoEstado }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al actualizar el estado del equipo.");
      }

      await fetchEquipos();
      setModalAbierto(false);
      setEquipoPendiente(null);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleConfirmarInhabilitarEspacio = async () => {
    if (!equipoPendiente || !id) return;

    try {
      const responseEquipo = await fetch(`${API_BASE_URL}/espacios/${id}/equipos/${equipoPendiente.idEstadoEquipo}/estado`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ estado: false }),
      });

      const dataEquipo = await responseEquipo.json();
      if (!responseEquipo.ok) {
        throw new Error(dataEquipo.message || "Error al actualizar el estado del equipo.");
      }

      const responseEspacio = await fetch(`${API_BASE_URL}/espacios/${id}/estado`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ estado: false }),
      });

      if (!responseEspacio.ok) {
        const dataEspacio = await responseEspacio.json();
        throw new Error(dataEspacio.message || "Error al inhabilitar el espacio.");
      }

      await fetchEquipos();
      setModalEspacioAbierto(false);
      setEquipoPendiente(null);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCancelarInhabilitarEspacio = () => {
    setModalEspacioAbierto(false);
    setEquipoPendiente(null);
  };

  const handleVolverAGestionEspacios = () => {
    navigate("/gestion-espacios");
  };

  return {
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
  };
}