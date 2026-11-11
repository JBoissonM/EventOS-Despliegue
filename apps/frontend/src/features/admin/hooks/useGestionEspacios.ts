import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { API_BASE_URL } from "../../../lib/apiClient";

export interface Espacio {
  idRecinto: number;
  nombre: string;
  tipo?: string;
  aforo: number;
  idEstadoRecinto: number;
}

export function useGestionEspacios() {
  const navigate = useNavigate();
  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [modalAbierto, setModalAbierto] = useState(false);
  const [espacioSeleccionado, setEspacioSeleccionado] = useState<Espacio | null>(null);

  const getToken = () => {
    const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
    return usuario.token || localStorage.getItem("token") || "";
  };

  const fetchEspacios = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/espacios`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText || "No se pudieron obtener los espacios."}`);
      }

      const data = await response.json();
      setEspacios(data);
    } catch (err: any) {
      setError(err.message || "Error de conexión con el servidor.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEspacios();
  }, [fetchEspacios]);

  const handlePreToggle = (espacio: Espacio) => {
    setEspacioSeleccionado(espacio);
    setModalAbierto(true);
  };

  const handleConfirmToggle = async () => {
    if (!espacioSeleccionado) return;
    const nuevoEstadoRecinto = espacioSeleccionado.idEstadoRecinto === 1 ? 2 : 1;

    try {
      const response = await fetch(`${API_BASE_URL}/espacios/${espacioSeleccionado.idRecinto}/estado`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ idEstadoRecinto: nuevoEstadoRecinto }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "No se pudo actualizar el estado del recinto.");
      }

      setModalAbierto(false);
      setEspacioSeleccionado(null);
      await fetchEspacios();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleVolverAlMenu = () => {
    navigate("/menu-admin");
  };

  const handleGestionarEquipos = (id: number) => {
    navigate(`/gestion-equipos/${id}`);
  };

  const isInhabilitando = espacioSeleccionado?.idEstadoRecinto === 1;

  return {
    espacios,
    loading,
    error,
    modalAbierto,
    setModalAbierto,
    espacioSeleccionado,
    isInhabilitando,
    handlePreToggle,
    handleConfirmToggle,
    handleVolverAlMenu,
    handleGestionarEquipos,
  };
}