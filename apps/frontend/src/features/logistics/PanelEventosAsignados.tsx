import { useMemo, useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { AlertCircle, CalendarDays, ChevronDown, LoaderCircle, Search, User } from "lucide-react";
import { Button } from "../../components/atoms/Button/Button";
import { useMisEventosLogistica } from "../logistics/hook/useMisEventosLogistica";

interface FilterOption {
  value: string;
  label: string;
}

interface MobileFilterDropdownProps {
  label: string;
  allLabel: string;
  allValue?: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
}

const dateOptions: FilterOption[] = [
  { value: "hoy", label: "Hoy" },
  { value: "semana", label: "Esta semana" },
  { value: "mes", label: "Este mes" },
];

function MobileFilterDropdown({
  label,
  allLabel,
  allValue = "",
  value,
  options,
  onChange,
}: MobileFilterDropdownProps) {
  const selectedOption = options.find((option) => option.value === value);
  const selectedLabel = value === allValue ? label : selectedOption?.label ?? label;
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const summaryRef = useRef<HTMLElement>(null);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (detailsRef.current && !detailsRef.current.contains(event.target as Node)) {
        detailsRef.current.open = false;
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  return (
    <details
      ref={detailsRef}
      className="relative min-w-0 md:hidden"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          if (detailsRef.current) detailsRef.current.open = false;
          summaryRef.current?.focus();
          event.stopPropagation();
        }
      }}
    >
      <summary
        ref={summaryRef}
        aria-label={`${label}: ${value === allValue ? allLabel : selectedLabel}`}
        className="flex h-11 w-full cursor-pointer list-none items-center justify-between gap-2 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5c1d33]"
      >
        <span className="min-w-0 truncate">{selectedLabel}</span>
        <ChevronDown size={18} aria-hidden="true" className="shrink-0" />
      </summary>
      <div
        role="group"
        aria-label={`Opciones de ${label.toLowerCase()}`}
        className="absolute inset-x-0 top-full z-30 mt-1 max-h-60 overflow-y-auto rounded-md border border-gray-300 bg-white p-1 shadow-lg"
      >
        {[{ value: allValue, label: allLabel }, ...options].map((option) => (
          <button
            key={option.value || "all"}
            type="button"
            aria-pressed={value === option.value}
            onClick={() => {
              onChange(option.value);
              if (detailsRef.current) detailsRef.current.open = false;
              summaryRef.current?.focus();
            }}
            className="block w-full rounded px-3 py-2 text-left text-sm wrap-break-word text-gray-800 hover:bg-gray-100"
          >
            {option.label}
          </button>
        ))}
      </div>
    </details>
  );
}

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
    <div className="min-h-screen bg-gray-50 font-merriweather text-gray-800">
      <main className="mx-auto w-full px-10 py-10">
        <div className="mb-10 flex flex-col gap-3">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <h1 className="text-[36px] font-bold text-gray-900 font-merriweather shrink-0">
              Mis Eventos Asignados
            </h1>

            <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-2 lg:flex lg:max-w-4xl lg:flex-wrap lg:items-center lg:justify-end">
              <label className="relative min-w-0 md:col-span-2 lg:min-w-55 lg:flex-1 lg:max-w-sm">
                <span className="sr-only">Buscar Evento Asignado</span>
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar evento o actividad..."
                  className="h-11 w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-11 text-sm text-gray-800 outline-offset-2 placeholder:text-gray-400 focus-visible:outline-2 focus-visible:outline-[#5c1d33]"
                />
                <Search size={19} aria-hidden="true" className="pointer-events-none absolute right-3 top-3 text-gray-400" />
              </label>

              <div className="min-w-0">
                <MobileFilterDropdown
                  label="Fecha"
                  allLabel="Todas las fechas"
                  allValue="todas"
                  value={dateFilter}
                  options={dateOptions}
                  onChange={setDateFilter}
                />
                <label className="hidden min-w-0 md:block">
                  <span className="sr-only">Filtrar por fecha</span>
                  <select
                    value={dateFilter}
                    onChange={(event) => setDateFilter(event.target.value)}
                    className="h-11 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-800 focus-visible:outline-2 focus-visible:outline-[#5c1d33]"
                  >
                    <option value="todas">Fecha</option>
                    <option value="hoy">Hoy</option>
                    <option value="semana">Esta semana</option>
                    <option value="mes">Este mes</option>
                  </select>
                </label>
              </div>

              <div className="min-w-0">
                <MobileFilterDropdown
                  label="Espacio"
                  allLabel="Todos los espacios"
                  value={venue}
                  options={venues.map((name) => ({ value: name, label: name }))}
                  onChange={setVenue}
                />
                <label className="hidden min-w-0 md:block">
                  <span className="sr-only">Filtrar por espacio</span>
                  <select
                    value={venue}
                    onChange={(event) => setVenue(event.target.value)}
                    className="h-11 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-800 focus-visible:outline-2 focus-visible:outline-[#5c1d33]"
                  >
                    <option value="">Espacio</option>
                    {venues.map((name) => <option value={name} key={name}>{name}</option>)}
                  </select>
                </label>
              </div>
            </div>
          </div>

          <div>
            <p className="text-[16px] italic text-teal-800 font-merriweather">
              "Elige tu evento asignado para iniciar la validación de entradas en puerta."
            </p>
          </div>
        </div>

        {status === "loading" && (
          <div role="status" aria-live="polite" className="flex min-h-72 flex-col items-center justify-center gap-4 text-gray-500">
            <LoaderCircle size={32} className="animate-spin" aria-hidden="true" />
            <p>Cargando eventos asignados...</p>
          </div>
        )}

        {status === "error" && (
          <div role="alert" className="flex min-h-64 flex-col items-center justify-center gap-4 rounded-lg border border-gray-300 bg-white p-6 text-center shadow-sm">
            <AlertCircle size={34} className="text-red-600" aria-hidden="true" />
            <p>{error}</p>
            <Button type="button" text="Reintentar" variant="primary" onClick={retry} className="rounded-md px-5 py-2 font-semibold">
            </Button>
          </div>
        )}

        {status === "success" && filteredEvents.length === 0 && (
          <div role="status" className="flex min-h-64 flex-col items-center justify-center gap-4 rounded-lg border border-gray-300 bg-white p-6 text-center shadow-sm">
            <CalendarDays size={34} className="text-gray-400" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-gray-900">
              {events.length === 0 ? "No tienes eventos asignados para logística" : "No encontramos eventos con esos filtros"}
            </h2>
            {hasFilters && (
              <Button text="Limpiar filtros" type="button" variant="outline" onClick={resetFilters} className="rounded-md border px-5 py-2 font-semiboldhover:bg-gray-50">
              </Button>
            )}
          </div>
        )}

        {status === "success" && filteredEvents.length > 0 && (
          <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
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

                    <div>
                      <span className="inline-block bg-[#f8e5e8] text-primary text-[16px] font-semibold px-2.5 py-0.5 rounded border border-[#e8c4cb]">
                        {item.alcance ?? "Público"}
                      </span>
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
      </main>
    </div>
  );
}

export default PanelEventosAsignados;