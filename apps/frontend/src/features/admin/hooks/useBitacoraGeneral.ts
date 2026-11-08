import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";

export interface BitacoraItem {
  idBitacoraEvento?: number;
  evento: string;
  estado: string;
  usuario: string;
  fecha: string;
  hora: string;
}

export function useBitacoraGeneral() {
  const navigate = useNavigate();
  const [bitacora, setBitacora] = useState<BitacoraItem[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalExito, setModalExito] = useState(false);

  const getToken = () => {
    const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
    return usuario.token || localStorage.getItem("token") || "";
  };

  const cargarBitacora = useCallback(async (query = "") => {
    setLoading(true);
    try {
      const endpoint = `http://localhost:3000/api/eventos/bitacora${query ? `?buscar=${encodeURIComponent(query)}` : ""}`;
      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBitacora(data.movimientos || []);
      } else {
        console.error("Error al obtener la bitácora del servidor");
        setBitacora([]);
      }
    } catch (err) {
      console.error("Error de conexión al cargar la bitácora", err);
      setBitacora([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      cargarBitacora(busqueda.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [busqueda, cargarBitacora]);

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    cargarBitacora(busqueda.trim());
  };

  const handleExportar = async () => {
    try {
      const endpoint = `http://localhost:3000/api/eventos/bitacora/exportar${busqueda ? `?buscar=${encodeURIComponent(busqueda)}` : ""}`;
      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `bitacora_general_${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        
        setModalExito(true);
      } else {
        alert("No hay registros disponibles para exportar.");
      }
    } catch (err) {
      console.error("Error al exportar la bitácora", err);
      alert("Ocurrió un error al intentar exportar el archivo.");
    }
  };

  const handleVolverAlMenu = () => {
    navigate("/menu-admin");
  };

  const cerrarModalExito = () => {
    setModalExito(false);
  };

  return {
    bitacora,
    busqueda,
    setBusqueda,
    loading,
    modalExito,
    handleBuscar,
    handleExportar,
    handleVolverAlMenu,
    cerrarModalExito,
  };
}