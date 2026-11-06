import { Badge } from "../../../../components/atoms/Badge/Badge";
import { Button } from "../../../../components/atoms/Button/Button";

export type TicketStatus = "active" | "checked-in" | "cancelled";
export type TicketVisibility = "public" | "internal" | "private";

export interface TicketCardProps {
  eventName: string;
  subEventName?: string;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  status: TicketStatus;
  visibility: TicketVisibility;
  posterUrl?: string;
  speakers?: string[];
  onViewQr?: () => void;
  onViewDetails?: () => void;
  onCancel?: () => void;
}

const statusLabels: Record<TicketStatus, string> = {
  active: "Activo",
  "checked-in": "Ingresado",
  cancelled: "Cancelado",
};

const statusVariants = {
  active: "success",
  "checked-in": "secondary",
  cancelled: "neutral",
} as const;

const visibilityLabels: Record<TicketVisibility, string> = {
  public: "Público",
  internal: "Interno",
  private: "Privado",
};

export function TicketCard({
  eventName,
  subEventName,
  date,
  startTime,
  endTime,
  venue,
  status,
  visibility,
  posterUrl,
  speakers = [],
  onViewQr,
  onViewDetails,
  onCancel,
}: TicketCardProps) {
  return (
    <article className="flex h-full min-w-0 flex-col gap-4 rounded-xl border border-eventos-panel-border bg-eventos-surface p-4 shadow-sm">
      <div className="flex aspect-video w-full shrink-0 items-center justify-center overflow-hidden rounded-md bg-eventos-panel-surface">
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={`Póster de ${eventName}`}
            className="h-full w-full object-contain"
            loading="lazy"
          />
        ) : (
          <span className="px-2 text-center text-sm text-eventos-muted-text">Póster no disponible</span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Badge variant={visibility === "public" ? "primary" : "secondary"}>
            {visibilityLabels[visibility]}
          </Badge>
          <Badge variant={statusVariants[status]}>{statusLabels[status]}</Badge>
        </div>

        <div className="space-y-1">
          <h2 className="break-words text-base font-bold text-eventos-ink md:text-lg">{eventName}</h2>
          {subEventName && <p className="break-words text-sm font-semibold text-secondary md:text-base">{subEventName}</p>}
        </div>

        <dl className="space-y-2 text-xs text-eventos-body-text sm:text-sm">
          <div>
            <dt className="font-semibold text-eventos-ink">Fecha</dt>
            <dd>{date}</dd>
          </div>
          <div>
            <dt className="font-semibold text-eventos-ink">Horario</dt>
            <dd>{startTime}–{endTime} hrs</dd>
          </div>
          <div>
            <dt className="font-semibold text-eventos-ink">Espacio</dt>
            <dd className="break-words">{venue}</dd>
          </div>
          {speakers.length > 0 && (
            <div>
              <dt className="font-semibold text-eventos-ink">Ponentes</dt>
              <dd className="break-words">{speakers.join(", ")}</dd>
            </div>
          )}
        </dl>
      </div>

      {(onViewQr || onViewDetails || onCancel) && (
        <div className="mt-auto flex w-full flex-wrap items-center gap-2 border-t border-eventos-divider pt-4">
          {status === "active" && onViewQr && <Button text="Ver QR" size="sm" onClick={onViewQr} />}
          {status !== "active" && onViewDetails && <Button text="Ver detalles" size="sm" onClick={onViewDetails} />}
          {status === "active" && onCancel && <Button text="Cancelar asistencia" variant="outline" size="sm" onClick={onCancel} />}
        </div>
      )}
    </article>
  );
}

export default TicketCard;
