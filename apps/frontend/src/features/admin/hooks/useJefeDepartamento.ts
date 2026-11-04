import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";

export interface CandidatoJefe {
  idUsuario: number;
  boleta: string;
  nombre: string;
  correoInstitucional: string;
  esJefeAcademia: boolean;
}

export function useJefeDepartamento() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"asignar" | "revocar">("asignar");
  const [candidatos, setCandidatos] = useState<CandidatoJefe[]>([]);
  const [jefesActivos, setJefesActivos] = useState<CandidatoJefe[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<CandidatoJefe | null>(null);
  const [accionTipo, setAccionTipo] = useState<"asignar" | "revocar">("asignar");

  const getToken = () => {
    const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
    return usuario.token || localStorage.getItem("token") || "";
  };

  const cargarDatos = useCallback(async (tab: "asignar" | "revocar", query = "") => {
    setLoading(true);
    try {
      const endpoint =
        tab === "asignar"
          ? `http://localhost:3000/api/usuarios/jefes-departamento/candidatos${query ? `?buscar=${encodeURIComponent(query)}` : ""}`
          : `http://localhost:3000/api/usuarios/jefes-departamento/activos${query ? `?buscar=${encodeURIComponent(query)}` : ""}`;

      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) throw new Error("Error al obtener los datos");

      const data = await response.json();
      if (tab === "asignar") {
        setCandidatos(data);
      } else {
        setJefesActivos(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos(activeTab, busqueda);
  }, [activeTab, cargarDatos]);

  const handleTabChange = (tab: "asignar" | "revocar") => {
    setActiveTab(tab);
    setBusqueda("");
  };

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    cargarDatos(activeTab, busqueda);
  };

  const abrirModal = (usuario: CandidatoJefe, tipo: "asignar" | "revocar") => {
    setUsuarioSeleccionado(usuario);
    setAccionTipo(tipo);
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setUsuarioSeleccionado(null);
  };

  const ejecutarAccion = async () => {
    if (!usuarioSeleccionado) return;

    try {
      const endpoint =
        accionTipo === "asignar"
          ? `http://localhost:3000/api/usuarios/${usuarioSeleccionado.idUsuario}/asignar-jefe`
          : `http://localhost:3000/api/usuarios/${usuarioSeleccionado.idUsuario}/revocar-jefe`;

      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Error en la operación");

      setMensajeExito(data.mensaje);
      setTimeout(() => setMensajeExito(null), 4000);

      cargarDatos(activeTab, busqueda);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setModalAbierto(false);
      setUsuarioSeleccionado(null);
    }
  };

  const handleVolverAlMenu = () => {
    navigate("/menu-admin");
  };

  const listaActual = activeTab === "asignar" ? candidatos : jefesActivos;

  return {
    activeTab,
    busqueda,
    setBusqueda,
    loading,
    mensajeExito,
    modalAbierto,
    usuarioSeleccionado,
    accionTipo,
    listaActual,
    handleTabChange,
    handleBuscar,
    abrirModal,
    cerrarModal,
    ejecutarAccion,
    handleVolverAlMenu,
  };
}