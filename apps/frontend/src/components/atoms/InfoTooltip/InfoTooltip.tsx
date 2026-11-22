import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Info } from "lucide-react";

export interface InfoTooltipProps {
  content: ReactNode;
  ariaLabel?: string;
  align?: "auto" | "left" | "center" | "right";
  side?: "auto" | "top" | "bottom";
  widthClassName?: string;
  className?: string;
}

const VIEWPORT_MARGIN = 12;
const GAP = 8;

/**
 * Accessible info tooltip rendered in a portal with automatic viewport clamping.
 * Supports hover, keyboard focus, and click/tap toggling for mobile devices.
 */
export function InfoTooltip({
  content,
  ariaLabel = "Más información",
  align = "auto",
  side = "auto",
  widthClassName = "w-72 sm:w-80",
  className = "",
}: InfoTooltipProps) {
  const tooltipId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<number | null>(null);

  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(
    null,
  );

  const isOpen = Boolean(content) && (hovered || focused || pinned);

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const scheduleHoverClose = useCallback(() => {
    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => {
      setHovered(false);
    }, 100);
  }, [clearCloseTimer]);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    const popover = popoverRef.current;
    if (!trigger || !popover) return;

    const triggerRect = trigger.getBoundingClientRect();
    const popoverRect = popover.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const popoverWidth = Math.min(
      popoverRect.width || 288,
      viewportWidth - VIEWPORT_MARGIN * 2,
    );
    const popoverHeight = popoverRect.height || 96;

    const spaceBelow = viewportHeight - triggerRect.bottom - VIEWPORT_MARGIN;
    const spaceAbove = triggerRect.top - VIEWPORT_MARGIN;

    const placeAbove =
      side === "top" ||
      (side === "auto" &&
        spaceBelow < popoverHeight + GAP &&
        spaceAbove > spaceBelow);

    const rawTop = placeAbove
      ? triggerRect.top - popoverHeight - GAP
      : triggerRect.bottom + GAP;

    const top = Math.max(
      VIEWPORT_MARGIN,
      Math.min(rawTop, viewportHeight - popoverHeight - VIEWPORT_MARGIN),
    );

    let rawLeft: number;
    if (align === "left") {
      rawLeft = triggerRect.left;
    } else if (align === "right") {
      rawLeft = triggerRect.right - popoverWidth;
    } else if (align === "center") {
      rawLeft = triggerRect.left + triggerRect.width / 2 - popoverWidth / 2;
    } else {
      rawLeft =
        triggerRect.left > viewportWidth / 2
          ? triggerRect.right - popoverWidth
          : triggerRect.left;
    }

    const left = Math.max(
      VIEWPORT_MARGIN,
      Math.min(rawLeft, viewportWidth - popoverWidth - VIEWPORT_MARGIN),
    );

    setPosition({ top, left });
  }, [align, side]);

  useLayoutEffect(() => {
    if (!isOpen) {
      setPosition(null);
      return;
    }
    updatePosition();
  }, [isOpen, content, updatePosition]);

  useEffect(() => {
    if (!isOpen) return;

    const handleReposition = () => updatePosition();

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (
        triggerRef.current?.contains(target) ||
        popoverRef.current?.contains(target)
      ) {
        return;
      }
      setPinned(false);
      setHovered(false);
      setFocused(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPinned(false);
        setHovered(false);
        setFocused(false);
      }
    };

    window.addEventListener("scroll", handleReposition, true);
    window.addEventListener("resize", handleReposition);
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("scroll", handleReposition, true);
      window.removeEventListener("resize", handleReposition);
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, updatePosition]);

  useEffect(() => {
    return () => clearCloseTimer();
  }, [clearCloseTimer]);

  if (content === null || content === undefined || content === false) {
    return null;
  }

  return (
    <span className={`inline-flex items-center ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        aria-controls={isOpen ? tooltipId : undefined}
        onClick={() => setPinned((prev) => !prev)}
        onMouseEnter={() => {
          clearCloseTimer();
          setHovered(true);
        }}
        onMouseLeave={scheduleHoverClose}
        onFocus={() => setFocused(true)}
        onBlur={(event) => {
          const nextTarget = event.relatedTarget as Node | null;
          if (nextTarget && popoverRef.current?.contains(nextTarget)) {
            return;
          }
          setFocused(false);
        }}
        className={`inline-flex cursor-pointer items-center justify-center rounded-full p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary ${
          pinned
            ? "bg-secondary/15 text-secondary"
            : "text-secondary hover:bg-secondary/10 hover:text-secondary/80"
        }`}
      >
        <Info size={15} aria-hidden="true" />
      </button>

      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={popoverRef}
            id={tooltipId}
            role="tooltip"
            onMouseEnter={() => {
              clearCloseTimer();
              setHovered(true);
            }}
            onMouseLeave={scheduleHoverClose}
            style={
              position
                ? { top: `${position.top}px`, left: `${position.left}px` }
                : { top: "-9999px", left: "-9999px", visibility: "hidden" }
            }
            className={`fixed z-[70] max-w-[calc(100vw-24px)] rounded-lg border border-eventos-panel-border bg-white p-3 font-merriweather text-xs font-normal leading-relaxed text-eventos-body-text shadow-xl ${widthClassName}`}
          >
            {content}
          </div>,
          document.body,
        )}
    </span>
  );
}

export default InfoTooltip;
