import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";

export interface UsuarioSistema {
  idUsuario: number;
  nombre: string;
  correo: string;
  rol: string;
}

export function useGestionUsuarios() {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState<UsuarioSistema[]>([]);
  const [filtroRol, setFiltroRol] = useState("Todos");
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(false);

  const [modalConfirmacion, setModalConfirmacion] = useState(false);
  const [modalExito, setModalExito] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<UsuarioSistema | null>(null);
  const [mensajeExito, setMensajeExito] = useState("");

  const getToken = () => {
    const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
    return usuario.token || localStorage.getItem("token") || "";
  };

  const cargarUsuarios = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (busqueda.trim()) {
        params.append("buscar", busqueda.trim());
      }
      if (filtroRol !== "Todos") {
        params.append("rol", filtroRol);
      }

      const queryString = params.toString() ? `?${params.toString()}` : "";
      const response = await fetch(`http://localhost:3000/api/usuarios/admin/cuentas${queryString}`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsuarios(data);
      } else {
        const errData = await response.json().catch(() => ({}));
        console.error("Error al cargar usuarios:", errData.message || response.statusText);
      }
    } catch (err) {
      console.error("Error de conexión al cargar usuarios", err);
    } finally {
      setLoading(false);
    }
  }, [busqueda, filtroRol]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      cargarUsuarios();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [busqueda, filtroRol, cargarUsuarios]);

  const abrirModalEliminar = (usuario: UsuarioSistema) => {
    setUsuarioSeleccionado(usuario);
    setModalConfirmacion(true);
  };

  const cerrarModalConfirmacion = () => {
    setModalConfirmacion(false);
  };

  const cerrarModalExito = () => {
    setModalExito(false);
  };

  const confirmarEliminacion = async () => {
    if (!usuarioSeleccionado) return;

    try {
      const response = await fetch(`http://localhost:3000/api/usuarios/admin/cuentas/${usuarioSeleccionado.idUsuario}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "No se pudo realizar la operación.");
      }

      setUsuarios((prev) => prev.filter((u) => u.idUsuario !== usuarioSeleccionado.idUsuario));
      setModalConfirmacion(false);
      setMensajeExito(`Se ha eliminado el usuario ${usuarioSeleccionado.nombre} exitosamente.`);
      setModalExito(true);
    } catch (err: any) {
      setModalConfirmacion(false);
      alert(err.message || "Ocurrió un error al intentar eliminar el usuario.");
    }
  };

  const handleVolverAlMenu = () => {
    navigate("/menu-admin");
  };

  return {
    usuarios,
    filtroRol,
    setFiltroRol,
    busqueda,
    setBusqueda,
    loading,
    modalConfirmacion,
    modalExito,
    usuarioSeleccionado,
    mensajeExito,
    abrirModalEliminar,
    cerrarModalConfirmacion,
    cerrarModalExito,
    confirmarEliminacion,
    handleVolverAlMenu,
  };
}