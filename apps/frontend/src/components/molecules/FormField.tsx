import { type ReactNode } from "react";
import { InfoTooltip } from "../atoms/InfoTooltip/InfoTooltip";
import { Label } from "../atoms/Label/Label";
import { Pencil } from "lucide-react";

interface FormFieldProps {
  label?: string;
  htmlFor?: string;
  required?: boolean;
  errorMessage?: string;
  children: ReactNode;
  mensajeAyuda?: string;
  readOnly?: boolean;
  className?: string;
  info?: ReactNode;
  tooltip?: ReactNode;
  editable?: ReactNode;
  tooltipLabel?: string;
}

export function FormField({
  label,
  htmlFor,
  required = false,
  errorMessage,
  children,
  mensajeAyuda,
  readOnly,
  className = "",
  info,
  tooltip,
  editable,
  tooltipLabel,
}: FormFieldProps) {
  return (
    <div className="flex min-w-0 flex-col justify-end gap-0">
      {label && (
        <div className="mb-1 flex items-center gap-1.5">
          <Label
            className={`!mb-0 ${className}`}
            htmlFor={htmlFor}
            required={required}
            readOnly={readOnly}
          >
            {label}
          </Label>
          {editable && (
            <Pencil
              size={18}
              aria-hidden="true"
              className="shrink-0 translate-y-[-2px]"
            />
          )}
          {tooltip && (
            <InfoTooltip
              content={tooltip}
              ariaLabel={tooltipLabel ?? `Información sobre ${label}`}
            />
          )}
          {info}
        </div>
      )}
      {children}
      {!readOnly && (
        <span
          aria-live="polite"
          className={`font-merriweather mt-1 block min-h-5 text-[12px] leading-4 ${
            errorMessage ? "text-eventos-error" : "text-black"
          }`}
        >
          {errorMessage ?? mensajeAyuda}
        </span>
      )}
    </div>
  );
}
