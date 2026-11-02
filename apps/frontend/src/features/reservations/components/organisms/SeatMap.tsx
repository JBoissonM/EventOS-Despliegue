import { Fragment } from "react";
import { DoorOpen, MoveLeft, MoveRight } from "lucide-react";
import { Seat } from "../atoms/Seat";
import { SeatLegend } from "../molecules/SeatLegend";

export interface SeatMapItem {
  idAsiento: number;
  fila: string;
  numero: number;
  occupied: boolean;
}

export interface SeatMapProps {
  seats: SeatMapItem[];
  selectedSeatId: number | null;
  onSelect: (idAsiento: number) => void;
  aisleAfter?: number[];
  venueName?: string;
}

export function SeatMap({
  seats,
  selectedSeatId,
  onSelect,
  aisleAfter = [],
  venueName,
}: SeatMapProps) {
  const rows = [...new Set(seats.map((seat) => seat.fila))].sort((a, b) =>
    a.localeCompare(b, "es", { numeric: true }),
  );

  const selectedSeat = seats.find(
    (seat) => seat.idAsiento === selectedSeatId && !seat.occupied,
  );
  const selectedSeatLabel = selectedSeat
    ? `${selectedSeat.fila}${selectedSeat.numero}`
    : null;

  if (seats.length === 0) {
    return (
      <section aria-label="Mapa de asientos" className="space-y-3">
        <h2 className="font-merriweather text-xl font-bold">
          Selecciona tu asiento
        </h2>
        <p role="status" className="text-sm text-eventos-muted-text">
          No hay asientos para mostrar.
        </p>
      </section>
    );
  }

  const seatNumbers = seats.map((seat) => seat.numero);
  const minNumber = Math.min(...seatNumbers);
  const maxNumber = Math.max(...seatNumbers);
  const columns = Array.from(
    { length: maxNumber - minNumber + 1 },
    (_, index) => minNumber + index,
  );

  const isMainAuditorium =
    venueName?.trim().toLocaleLowerCase("es") === "auditorio principal";
  const modeledAisles =
    isMainAuditorium && minNumber === 1 && maxNumber === 23
      ? [6, 17]
      : [];
  const breaks = aisleAfter.length > 0 ? aisleAfter : modeledAisles;
  const columnGroups: number[][] = [[]];

  for (const column of columns) {
    columnGroups[columnGroups.length - 1].push(column);
    if (breaks.includes(column) && column !== maxNumber) {
      columnGroups.push([]);
    }
  }

  const seatsByPosition = new Map<string, SeatMapItem>();
  for (const seat of seats) {
    seatsByPosition.set(`${seat.fila}-${seat.numero}`, seat);
  }

  return (
    <section aria-label="Mapa de asientos" className="min-w-0 space-y-5">
      <div className="space-y-2">
        <h2 className="font-merriweather text-xl font-bold">
          Selecciona tu asiento
        </h2>
        <p className="text-sm text-eventos-muted-text">
          Selecciona uno de los lugares disponibles.
        </p>
      </div>

      {venueName && (
        <h3 className="text-center font-merriweather font-semibold">
          {venueName}
        </h3>
      )}

      <div className="mx-auto w-full max-w-[744px] rounded-md border border-eventos-panel-border bg-eventos-secondary-light py-5 text-center font-merriweather font-semibold">
        Escenario
      </div>

      <div
        aria-hidden="true"
        className="flex items-center justify-between px-2 text-eventos-secondary sm:px-5"
      >
        <MoveLeft size={25} strokeWidth={1.5} />
        <MoveRight size={25} strokeWidth={1.5} />
      </div>

      <p className="text-sm text-eventos-muted-text sm:hidden">
        Desliza el mapa hacia los lados para ver todos los asientos.
      </p>

      <div
        role="region"
        tabIndex={0}
        aria-label="Plano de asientos con desplazamiento horizontal"
        className="min-w-0 w-full overflow-x-auto overscroll-x-contain rounded-lg pb-3 focus-visible:outline-2 focus-visible:outline-eventos-primary"
      >
        <div className="mx-auto w-max">
          <div className="flex items-start gap-3">
            <div aria-label="Filas" className="flex flex-col gap-1 pt-[17px]">
              {rows.map((row) => (
                <span
                  key={row}
                  className="flex h-7 w-7 items-center justify-center font-semibold"
                >
                  {row}
                </span>
              ))}
            </div>

            <div>
              <div className="rounded-md border border-eventos-panel-border p-4">
                <div className="flex flex-col gap-1">
                  {rows.map((row) => (
                    <div
                      key={row}
                      role="group"
                      aria-label={`Fila ${row}`}
                      className="flex items-center"
                    >
                      {columnGroups.map((group, groupIndex) => (
                        <Fragment key={group[0]}>
                          {groupIndex > 0 && (
                            <span aria-hidden="true" className="w-10 shrink-0" />
                          )}
                          <div className="flex gap-1">
                            {group.map((number) => {
                              const seat = seatsByPosition.get(`${row}-${number}`);
                              if (!seat) {
                                return (
                                  <span
                                    key={number}
                                    aria-hidden="true"
                                    className="h-7 w-7 shrink-0"
                                  />
                                );
                              }

                              return (
                                <Seat
                                  key={seat.idAsiento}
                                  idAsiento={seat.idAsiento}
                                  label={`${seat.fila}${seat.numero}`}
                                  status={
                                    seat.occupied
                                      ? "occupied"
                                      : seat.idAsiento === selectedSeatId
                                        ? "selected"
                                        : "available"
                                  }
                                  onSelect={onSelect}
                                  compact
                                />
                              );
                            })}
                          </div>
                        </Fragment>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              <div
                className="flex items-center px-[17px] pt-3"
                aria-label="Numeración de asientos"
              >
                {columnGroups.map((group, groupIndex) => (
                  <Fragment key={group[0]}>
                    {groupIndex > 0 && (
                      <span
                        aria-hidden="true"
                        className="flex w-10 shrink-0 items-center justify-center text-eventos-secondary"
                      >
                        <DoorOpen size={20} strokeWidth={1.5} />
                      </span>
                    )}
                    <div className="flex gap-1">
                      {group.map((number) => (
                        <span
                          key={number}
                          className="flex h-5 w-7 shrink-0 items-center justify-center text-xs"
                        >
                          {number}
                        </span>
                      ))}
                    </div>
                  </Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm" aria-live="polite">
          <span className="font-semibold">Asiento seleccionado:</span>{" "}
          {selectedSeatLabel ?? "Ninguno"}
        </p>
        <SeatLegend />
      </div>
    </section>
  );
}

export default SeatMap;
