import { useEffect, useState } from "react";
import { SeccionSolicitudesPendientes } from "../../components/organisms/MenuSubdireccion/SeccionSolicitudesPendientes";
import { CardMetricas } from "../../components/molecules/CardMetricas";
import { API_BASE_URL } from "../../lib/apiClient";
import { PageHeader } from "../../components/organisms/PageHeader/PageHeader";
import { AgendaDiaria } from "../../components/organisms/MenuSubdireccion/SeccionAgendaDiaria";

export function MenuSubdireccion() {
  const [totalSolicitudes, setTotalSolicitudes] = useState<number>(0);
  const [totalCuentas, setTotalCuentas] = useState<number>(0);
  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
  const nombreUsuario = usuario.nombre || "";

  useEffect(() => {
    const fetchMetricas = async () => {
      const token = localStorage.getItem("token") || "";
      if (!token) return;
      const headers = { Authorization: `Bearer ${token}` };
      try {
        const resSolicitudes = await fetch(
          `${API_BASE_URL}/solicitudes?estado=Pendiente`,
          { headers },
        );
        if (resSolicitudes.ok) {
          const data = await resSolicitudes.json();
          if (Array.isArray(data)) {
            setTotalSolicitudes(data.length);
          }
        }
        const resCuentas = await fetch(
          `${API_BASE_URL}/usuarios/verificaciones/pendientes`,
          { headers },
        );
        if (resCuentas.ok) {
          const data = await resCuentas.json();
          if (Array.isArray(data)) {
            setTotalCuentas(data.length);
          }
        }
      } catch (error) {
        console.error("Error al cargar métricas:", error);
      }
    };
    fetchMetricas();
  }, []);

  return (
    <section className="space-y-5 ">
      <div className="min-w-0 xl:max-w-sm xl:shrink-0">
        <PageHeader
          title="Menú principal"
          description={`Nos alegra verte por aquí, ${nombreUsuario}`}
        />
      </div>
      <h2 className="font-merriweather text-base sm:text-[24px]">
        Tus pendientes
      </h2>
      <br />
      <div
        id="contenedorMetricas"
        className="grid grid-cols-1 gap-5 sm:grid-cols-2 justify-items-center "
      >
        <CardMetricas titulo="Solicitudes pendientes">
          <span className="font-merriweather font-bold text-3xl">
            {totalSolicitudes}
          </span>
        </CardMetricas>
        <CardMetricas titulo="Cuentas por verificar">
          <span className="font-merriweather font-bold text-3xl">
            {totalCuentas}
          </span>
        </CardMetricas>
      </div>
      <br />
      <h2 className="font-merriweather text-base sm:text-[24px]">
        Agenda del día de hoy
      </h2>
      <AgendaDiaria />
      <br />
      <h2 className="font-merriweather text-base sm:text-[24px]">
        Solicitudes pendientes recientes
      </h2>
      <SeccionSolicitudesPendientes />
    </section>
  );
}
