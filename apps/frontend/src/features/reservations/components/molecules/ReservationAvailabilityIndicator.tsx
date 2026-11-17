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
    <div className="space-y-1">
      <p
        role="status"
        className="inline-flex rounded-lg border border-eventos-panel-border bg-eventos-panel-surface px-4 py-2 text-sm font-semibold text-eventos-secondary"
      >
        {availableSeats} de {capacity} lugares disponibles
      </p>

      {isRefreshing && (
        <p
          role="status"
          className="text-xs text-eventos-muted-text"
        >
          Actualizando disponibilidad...
        </p>
      )}
    </div>
  );
}