import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { AlertCircle, CalendarDays, LoaderCircle } from "lucide-react";
import { obtenerEtiquetaModalidad } from "@eventos/shared";
import { Badge } from "../../components/atoms/Badge/Badge";
import { Button } from "../../components/atoms/Button/Button";
import { PageContainer } from "../../components/templates/PageContainer";
import { PageHeader } from "../../components/organisms/PageHeader/PageHeader";
import { SearchField } from "../../components/molecules/SearchField";
import { FilterDropdown, type FilterOption } from "../../components/molecules/FilterDropdown";
import { ClearFiltersButton } from "../../components/molecules/ClearFiltersButton";
import { useMisEventosLogistica } from "../logistics/hook/useMisEventosLogistica";

const dateOptions: FilterOption[] = [
  { value: "hoy", label: "Hoy" },
  { value: "semana", label: "Esta semana" },
  { value: "mes", label: "Este mes" },
];

export function PanelEventosAsignados() {
  const navigate = useNavigate();
  const { events, status, error, retry } = useMisEventosLogistica();
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<string>("todas");
  const [venue, setVenue] = useState("");

  const venues = useMemo(() =>
    [...new Set(events.map((item: any) => item.espacio).filter((name: string | undefined): name is string => Boolean(name)))]
      .sort((a, b) => a.localeCompare(b, "es")),
    [events],
  );

  const filteredEvents = useMemo(() => {
    return events.filter((item: any) => {
      const matchSearch = search.trim() === "" ||
        item.nombreEvento?.toLowerCase().includes(search.toLowerCase()) ||
        item.nombreSubEvento?.toLowerCase().includes(search.toLowerCase()) ||
        item.descripcion?.toLowerCase().includes(search.toLowerCase());

      const matchVenue = venue === "" || item.espacio === venue;

      let matchDate = true;
      if (dateFilter !== "todas" && item.fecha) {
        const itemDate = new Date(item.fecha);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (dateFilter === "hoy") {
          matchDate = itemDate.toDateString() === today.toDateString();
        } else if (dateFilter === "semana") {
          const nextWeek = new Date(today);
          nextWeek.setDate(today.getDate() + 7);
          matchDate = itemDate >= today && itemDate <= nextWeek;
        } else if (dateFilter === "mes") {
          matchDate = itemDate.getMonth() === today.getMonth() && itemDate.getFullYear() === today.getFullYear();
        }
      }

      return matchSearch && matchVenue && matchDate;
    });
  }, [events, search, venue, dateFilter]);

  const hasFilters = search.trim() !== "" || dateFilter !== "todas" || venue !== "";
  const resetFilters = () => {
    setSearch("");
    setDateFilter("todas");
    setVenue("");
  };

  return (
    <PageContainer>
      <div className="mb-6 flex flex-col gap-6 lg:mb-8 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 xl:max-w-sm xl:shrink-0">
          <PageHeader
            title="Mis Eventos Asignados"
            description="Elige tu evento asignado para iniciar la validación de entradas en puerta"
            back={{ to: "/menu-asistente", label: "Volver al menú" }}
          />
        </div>

        <div className="w-full min-w-0 space-y-3 xl:max-w-5xl">
          <SearchField
            value={search}
            onChange={setSearch}
            placeholder="Buscar evento o actividad..."
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="min-w-0">
              <FilterDropdown
                label="Fecha"
                allLabel="Todas las fechas"
                allValue="todas"
                value={dateFilter}
                options={dateOptions}
                onChange={setDateFilter}
              />
            </div>

            <div className="min-w-0">
              <FilterDropdown
                label="Espacio"
                allLabel="Todos los espacios"
                value={venue}
                options={venues.map((name) => ({ value: name, label: name }))}
                onChange={setVenue}
              />
            </div>
          </div>
        </div>
      </div>

      {hasFilters && (
        <div className="flex justify-end mb-6">
          <ClearFiltersButton onClick={resetFilters} />
        </div>
      )}

      {status === "loading" && (
        <div role="status" aria-live="polite" className="flex min-h-72 flex-col items-center justify-center gap-4 text-gray-500 font-merriweather">
          <LoaderCircle size={32} className="animate-spin" aria-hidden="true" />
          <p>Cargando eventos asignados...</p>
        </div>
      )}

      {status === "error" && (
        <div role="alert" className="flex min-h-64 flex-col items-center justify-center gap-4 rounded-lg border border-gray-300 bg-white p-6 text-center shadow-sm font-merriweather">
          <AlertCircle size={34} className="text-red-600" aria-hidden="true" />
          <p>{error}</p>
          <Button type="button" text="Reintentar" variant="primary" onClick={retry} className="rounded-md px-5 py-2 font-semibold" />
        </div>
      )}

      {status === "success" && filteredEvents.length === 0 && (
        <div role="status" className="flex min-h-64 flex-col items-center justify-center gap-4 rounded-lg border border-gray-300 bg-white p-6 text-center shadow-sm font-merriweather">
          <CalendarDays size={34} className="text-gray-400" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-gray-900">
            {events.length === 0 ? "No tienes eventos asignados para logística" : "No encontramos eventos con esos filtros"}
          </h2>
          {hasFilters && (
            <ClearFiltersButton onClick={resetFilters} />
          )}
        </div>
      )}

      {status === "success" && filteredEvents.length > 0 && (
        <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3 font-merriweather">
          {filteredEvents.map((item: any) => {
            const fechaFormateada = item.fecha 
              ? new Date(item.fecha).toLocaleDateString("es-MX", { timeZone: "UTC", year: "numeric", month: "2-digit", day: "2-digit" }) 
              : "Por definir";

            const rawPoster = item.poster?.trim();
            const posterSrc = rawPoster
              ? /^https?:\/\//i.test(rawPoster)
                ? rawPoster
                : `http://localhost:9000/eventos-public/${rawPoster.replace(/^\/+/, "")}`
              : null;

            return (
              <div
                key={`${item.idEvento}-${item.idSubEvento}`}
                className="bg-white rounded-lg border border-gray-300 shadow-sm p-5 flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow"
              >
                <div className="space-y-3">
                  <div className="w-full h-40 bg-gray-100 rounded-md overflow-hidden border border-gray-200">
                    {posterSrc ? (
                      <img src={posterSrc} alt={item.nombreEvento} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                        Sin imagen
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-block bg-[#f8e5e8] text-primary text-[16px] font-semibold px-2.5 py-0.5 rounded border border-[#e8c4cb]">
                      {item.alcance ?? "Público"}
                    </span>
                    <Badge variant="secondary" size="md">
                      {item.etiquetaModalidad || (item.idModalidadAcceso ? obtenerEtiquetaModalidad(Number(item.idModalidadAcceso)) : "Acceso Libre")}
                    </Badge>
                  </div>

                  <h3 className="text-[20px] font-bold text-gray-900 leading-snug font-merriweather">
                    {item.nombreEvento}
                  </h3>
                  
                  <p className="text-[16px] font-semibold text-gray-600 font-merriweather">
                    Actividad: {item.nombreSubEvento}
                  </p>

                  <div className="text-[16px] text-gray-700 space-y-1 font-merriweather">
                    <p><strong>Fecha:</strong> {fechaFormateada}</p>
                    <p><strong>Horario:</strong> {item.horarioTexto || `${item.horaInicio} - ${item.horaFin}`}</p>
                    <p><strong>Espacio:</strong> {item.espacio}</p>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    text="Control de Acceso"
                    type="button"
                    variant="primary"
                    onClick={() => navigate(`/control-acceso/${item.idSubEvento}`)}
                    className="text-[12px] px-4 py-2 rounded-md shadow transition-colors font-merriweather"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}

export default PanelEventosAsignados;