import { DoorOpen, LogOut } from "lucide-react";
import type { EstadoAsientoMapa } from "@eventos/shared";
import { Seat } from "../atoms/Seat";
import { SeatLegend } from "../molecules/SeatLegend";

export interface SeatMapItem {
  idAsiento: number;
  fila: string;
  numero: number;
  occupied: boolean;
  estado?: EstadoAsientoMapa;
}

export interface SeatMapProps {
  seats: SeatMapItem[];
  selectedSeatId: number | null;
  onSelect: (idAsiento: number) => void;
  disabled?: boolean;
  pendingSeatId?: number | null;
  aisleAfter?: number[];
  venueName?: string;
}

export function SeatMap({
  seats,
  selectedSeatId,
  onSelect,
  disabled = false,
  pendingSeatId = null,
  aisleAfter = [],
  venueName,
}: SeatMapProps) {
  const rows = [...new Set(seats.map((seat) => seat.fila))].sort((a, b) => a.localeCompare(b, "es", { numeric: true }));
  const seatNumbers = seats.map((seat) => seat.numero);
  const minNumber = seatNumbers.length ? Math.min(...seatNumbers) : 0;
  const maxNumber = seatNumbers.length ? Math.max(...seatNumbers) : -1;
  const columns = Array.from({ length: maxNumber - minNumber + 1 }, (_, index) => index + minNumber);
  const columnGroups: number[][] = [[]];

  for (const column of columns) {
    columnGroups[columnGroups.length - 1].push(column);
    if (aisleAfter.includes(column) && column !== maxNumber) columnGroups.push([]);
  }

  const seatsByPosition = new Map<string, SeatMapItem>();
  for (const seat of seats) seatsByPosition.set(`${seat.fila}-${seat.numero}`, seat);

  return (
    <section aria-label="Mapa de asientos" className="space-y-5 text-eventos-body-text">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-eventos-ink">
            Selecciona tu asiento
          </h2>
          <p className="text-sm">
            Elige un asiento disponible en el plano del auditorio.
          </p>
          <p className="text-sm lg:hidden">
            Desliza horizontalmente para explorar el mapa completo.
          </p>
          {pendingSeatId !== null && (
            <p role="status" className="text-sm font-semibold text-eventos-secondary">
              Actualizando asiento...
            </p>
          )}
        </div>
      </div>

      {seats.length === 0 ? (
        <p
          role="status"
          className="rounded-md border border-eventos-panel-border p-4"
        >
          No hay un plano de asientos disponible.
        </p>
      ) : (
        <div className="space-y-4">
          {venueName && (
            <h3 className="text-center font-semibold text-eventos-ink">
              {venueName}
            </h3>
          )}

          <div className="rounded-md border border-eventos-secondary bg-eventos-secondary-light px-4 py-5 text-center font-semibold text-eventos-secondary">
            Escenario
          </div>

          <div
            className="flex items-center justify-between px-2 text-eventos-secondary"
            aria-label="Salidas laterales representadas en el plano"
          >
            <span
              role="img"
              aria-label="Salida lateral izquierda"
              title="Salida lateral izquierda"
            >
              <LogOut
                aria-hidden="true"
                className="h-6 w-6 rotate-180"
              />
            </span>

            <span
              role="img"
              aria-label="Salida lateral derecha"
              title="Salida lateral derecha"
            >
              <LogOut
                aria-hidden="true"
                className="h-6 w-6"
              />
            </span>
          </div>

          <div className="max-w-full overflow-x-auto overscroll-x-contain pb-3">
            <div className="mx-auto w-max max-w-none">
              <div className="rounded-lg border border-eventos-panel-border p-4">
                <div className="space-y-1.5">
                {rows.map((row) => (
                  <div key={row} role="group" aria-label={`Fila ${row}`} className="flex items-center gap-3">
                    <span className="sticky left-0 z-10 flex h-7 w-6 shrink-0 items-center justify-end bg-eventos-panel-surface pr-1 font-semibold">
                      {row}
                    </span>
                    <div className="flex gap-7">
                      {columnGroups.map((group, index) => (
                        <div key={index} className="flex gap-1">
                          {group.map((number) => {
                            const seat = seatsByPosition.get(`${row}-${number}`);
                            return seat ? (
                              <Seat
                                key={seat.idAsiento}
                                idAsiento={seat.idAsiento}
                                label={`${seat.fila}${seat.numero}`}
                                status={selectedSeatId === seat.idAsiento ? "selected" : seat.estado === "RETENIDO" ? "held" : seat.occupied ? "occupied" : "available"}
                                onSelect={onSelect}
                                disabled={disabled}
                                compact
                              />
                            ) : (
                              <span key={number} aria-hidden="true" className="inline-block h-7 w-7" />
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div aria-hidden="true" className="mt-3 flex gap-3">
                <span className="w-6 shrink-0" />
                <div className="flex">
                  {columnGroups.map((group, index) => (
                    <div key={index} className="flex items-center">
                      <div className="flex gap-1">
                        {group.map((number) => <span key={number} className="flex w-7 justify-center text-xs">{number}</span>)}
                      </div>
                      {index < columnGroups.length - 1 && (
                        <span className="flex w-7 shrink-0 items-center justify-center text-eventos-secondary" title="Puerta del pasillo">
                          <DoorOpen aria-hidden="true" className="h-5 w-5" />
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <SeatLegend />
    </section>
  );
}

export default SeatMap;
