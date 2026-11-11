import { useState, useEffect, useCallback } from "react";
import { API_BASE_URL } from "../../../lib/apiClient";

export function useMisEventosLogistica() {
  const [events, setEvents] = useState<any[]>([]);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  const getToken = () => {
    const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
    return usuario.token || localStorage.getItem("token") || "";
  };

  const loadEventosAsignados = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/logistica/mis-eventos`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error("No se pudieron cargar los eventos asignados para logística.");
      }

      const data = await response.json();
      setEvents(Array.isArray(data) ? data : data.eventos || []);
      setStatus("success");
    } catch (err: any) {
      setError(err.message || "Ocurrió un error inesperado al conectar con el servidor.");
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    loadEventosAsignados();
  }, [loadEventosAsignados]);

  return {
    events,
    status,
    error,
    retry: loadEventosAsignados,
  };
}