import { UsersRound } from "lucide-react";

interface ReservationAvailabilityIndicatorProps {
  availableSeats: number;
  capacity: number;
  isRefreshing?: boolean;
}

export function ReservationAvailabilityIndicator({
  availableSeats,
  capacity,
  isRefreshing = false,
}: ReservationAvailabilityIndicatorProps) {
  return (
    <div className="space-y-1 inline-flex items-center gap-2 inline-flex rounded-lg border border-eventos-panel-border bg-eventos-panel-surface px-4 py-2 text-sm font-semibold text-eventos-secondary">
      <UsersRound
        size={18}
        className="mt-0.5 shrink-0 text-eventos-secondary"
      />
      <p role="status">
        {availableSeats} de {capacity} lugares disponibles
      </p>

      {isRefreshing && (
        <p role="status" className="sr-only">
          Actualizando disponibilidad...
        </p>
      )}
    </div>
  );
}
