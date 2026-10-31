import { useState } from "react";
import { ImageOff } from "lucide-react";

export interface EventBannerProps {
  eventName: string;
  posterUrl?: string | null;
  className?: string;
}

export function EventBanner({
                              eventName,
                              posterUrl,
                              className = "",
                            }: EventBannerProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  const imageUrl = posterUrl?.trim() || null;

  return (
    <div
      className={`
        flex h-40 w-full items-center justify-center
        overflow-hidden rounded-md
        border border-secondary bg-white
        sm:h-44 md:h-48
        ${className}
      `}
    >
      {imageUrl && failedUrl !== imageUrl ? (
        <img
          src={imageUrl}
          alt={`Póster del evento ${eventName}`}
          className="h-full w-full object-contain"
          decoding="async"
          onError={() => setFailedUrl(imageUrl)}
        />
      ) : (
        <div
          className="
            flex flex-col items-center justify-center
            gap-2 px-4 text-center text-gray-500
          "
        >
          <ImageOff
            size={28}
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

export default EventBanner;