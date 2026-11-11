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
    relative isolate flex w-full items-center justify-center
    overflow-hidden rounded-xl
    border border-eventos-panel-border bg-eventos-surface
    aspect-video max-h-[400px]
    ${className}
  `}
    >
      {showImage ? (
        <>
          <img
            src={imageUrl}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover blur-xl scale-110 opacity-80"
            decoding="async"
          />
          <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]" aria-hidden="true" />
          <img
            src={imageUrl}
            alt={`Póster del evento ${eventName}`}
            className="relative z-10 h-full w-full object-contain drop-shadow-md"
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