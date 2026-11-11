import { useState } from "react";
import { useNavigate } from "react-router";
import { API_BASE_URL } from "../../../lib/apiClient";

export function useVerificacion() {
  const navigate = useNavigate();
  const [tipoPerfil, setTipoPerfil] = useState("Estudiante");
  const [formData, setFormData] = useState({
    infoAdicional: "",
    archivo: null as File | null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const getToken = () => {
    const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
    return usuario.token || localStorage.getItem("token") || "";
  };

  const handleTipoPerfilChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTipoPerfil(e.target.value);
    setFormData((prev) => ({ ...prev, infoAdicional: "" }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData((prev) => ({ ...prev, archivo: e.target.files![0] }));
    }
  };

  const handleInfoAdicionalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, infoAdicional: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.archivo) {
      setError("Por favor adjunta el archivo PDF correspondiente.");
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();
      data.append("tipoPerfil", tipoPerfil);
      data.append("informacionAdicional", formData.infoAdicional);
      data.append("documentoPDF", formData.archivo);

      const response = await fetch(`${API_BASE_URL}/usuarios/verificar`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
        body: data,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Error al enviar la solicitud de verificación.");
      }

      navigate("/perfil");
    } catch (err: any) {
      setError(err.message || "Error de conexión con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  const handleVolverAlPerfil = () => {
    navigate("/perfil");
  };

  return {
    tipoPerfil,
    formData,
    loading,
    error,
    handleTipoPerfilChange,
    handleFileChange,
    handleInfoAdicionalChange,
    handleSubmit,
    handleVolverAlPerfil,
  };
}