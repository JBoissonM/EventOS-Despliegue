import { useState } from "react";
import { ImageOff } from "lucide-react";

interface EventBannerProps {
  eventName: string;
  posterUrl: string | null;
  className?: string;
}

export function EventBanner({
                              eventName,
                              posterUrl,
                              className = "",
                            }: EventBannerProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  const rawUrl = posterUrl?.trim() || null;
  const imageUrl = rawUrl
    ? /^https?:\/\//i.test(rawUrl)
      ? rawUrl
      : `http://localhost:9000/eventos-public/${rawUrl.replace(/^\/+/, "")}`
    : null;
  const showImage = imageUrl !== null && failedUrl !== imageUrl;

  return (
    <div
      className={`
        relative isolate flex h-40 w-full items-center justify-center
        overflow-hidden rounded-md
        border border-eventos-panel-border bg-eventos-surface
        sm:h-44 md:h-48
        ${className}
      `}
    >
      {showImage ? (
        <>
          <img
            src={imageUrl}
            alt={`Póster del evento ${eventName}`}
            className="h-full w-full object-contain"
            decoding="async"
            onError={() => setFailedUrl(imageUrl)}
          />
        </>
      ) : (
        <div className="flex flex-col items-center gap-3 px-4 text-center text-eventos-placeholder-text">
          <ImageOff
            size={32}
            strokeWidth={1.5}
            aria-hidden="true"
          />

          <span className="text-sm">
            Póster no disponible
          </span>
        </div>
      )}
    </div>
  );
}