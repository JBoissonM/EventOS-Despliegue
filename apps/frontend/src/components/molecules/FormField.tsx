import { ReactNode } from "react";
import { Label } from "../atoms/Label/Label";

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
}

export function FormField({
  label,
  htmlFor,
  required = false,
  errorMessage,
  children,
  mensajeAyuda,
  readOnly,
  className,
  info,
}: FormFieldProps) {
  return (
    <div className="flex min-w-0 flex-col justify-end gap-0">
      {label && (
        <div className="flex items-center gap-1.5">
          {info}
          <Label
            className={className}
            htmlFor={htmlFor}
            required={required}
            readOnly={readOnly}
          >
            {label}
          </Label>
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
