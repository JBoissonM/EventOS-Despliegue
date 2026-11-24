import type { ReactNode } from "react";

export interface CardMetricasProps {
  titulo: string;
  children: ReactNode;
  className?: string;
}

export function CardMetricas({
  titulo,
  children,
  className = "",
}: CardMetricasProps) {
  return (
    <div
      id="contenedorCard"
      className={`mx-auto w-full max-w-7xl grid grid-cols-1 gap-5 justify-items-center border border-gray-200 w-[15rem] sm:w-fit p-5 bg-white shadow-sm rounded-md ${className}`}
    >
      <span className="font-merriweather font-medium text-base md:text-2xl text-center">
        {titulo}
      </span>
      {children}
    </div>
  );
}
