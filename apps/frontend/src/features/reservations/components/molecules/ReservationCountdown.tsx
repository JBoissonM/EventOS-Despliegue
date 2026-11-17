import { useEffect, useState } from "react";

interface ReservationCountdownProps {
  expiresAt: number | null;
  onExpire: () => void;
}

function getRemainingSeconds(expiresAt: number | null): number | null {
  if (expiresAt === null) return null;

  return Math.max(
    0,
    Math.ceil((expiresAt - Date.now()) / 1000),
  );
}

export function ReservationCountdown({
                                       expiresAt,
                                       onExpire,
                                     }: ReservationCountdownProps) {
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(
    () => getRemainingSeconds(expiresAt),
  );

  useEffect(() => {
    if (expiresAt === null) {
      setRemainingSeconds(null);
      return;
    }

    let expirationReported = false;

    const updateCountdown = () => {
      const remaining = getRemainingSeconds(expiresAt);

      setRemainingSeconds(remaining);

      if (remaining === 0 && !expirationReported) {
        expirationReported = true;
        onExpire();
      }
    };

    updateCountdown();

    const interval = window.setInterval(updateCountdown, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [expiresAt, onExpire]);

  if (remainingSeconds === null) return null;

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  const formattedTime = [minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");

  return (
    <div className="flex items-center justify-between gap-2 xl:gap-3 xl:rounded-md xl:border xl:border-eventos-panel-border xl:bg-eventos-panel-surface xl:px-4 xl:py-3">
      <span className="hidden text-sm font-semibold text-eventos-body-text xl:inline">
        Tiempo para confirmar tu selección
      </span>

            <span className="text-xs font-semibold text-eventos-muted-text xl:hidden">
        Tiempo:
      </span>

      <span
        role="timer"
        aria-live="off"
        aria-label={`${minutes} minutos y ${seconds} segundos restantes`}
        className="font-mono text-xl font-bold tabular-nums text-eventos-ink"
      >
        {formattedTime}
      </span>
    </div>
  );
}

export default ReservationCountdown;