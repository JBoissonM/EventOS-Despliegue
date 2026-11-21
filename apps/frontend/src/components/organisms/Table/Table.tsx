import type { ReactNode } from "react";

export type Columna<T> = {
  id: string;
  encabezado: string;
  render: (fila: T) => ReactNode;
  resaltar?: boolean;
  className?: string;
};

type TableProps<T> = {
  columnas: Columna<T>[];
  filas: T[];
  obtenerClave: (fila: T) => string | number;
  className?: string;
  filaClassName?: string;
  encabezadoClassName?: string;
};

export function Table<T>({
  columnas,
  filas,
  obtenerClave,
  className = "",
  filaClassName = "h-[120px]",
  encabezadoClassName = "h-[120px] border-b border-gray-300",
}: TableProps<T>) {
  return (
    <table className={`text-sm sm:text-base ${className}`}>
      <thead>
        <tr className={encabezadoClassName}>
          {columnas.map((columna) => (
            <th
              key={columna.id}
              className={`whitespace-nowrap ${columna.className ?? ""}`}
            >
              {columna.encabezado}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {filas.map((fila) => (
          <tr className={filaClassName} key={obtenerClave(fila)}>
            {columnas.map((columna) => (
              <td
                key={columna.id}
                className={`border-b border-gray-300 ${columna.className ?? ""}`}
              >
                {columna.resaltar ? (
                  <div className="inline-block max-w-full rounded-md bg-gray-100 px-4 py-3">
                    {columna.render(fila)}
                  </div>
                ) : (
                  columna.render(fila)
                )}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
