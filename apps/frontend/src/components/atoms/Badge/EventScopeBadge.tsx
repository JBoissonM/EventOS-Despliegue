import { AlcanceEvento } from "@eventos/shared";
import { Badge } from "./Badge";

interface EventScopeBadgeProps {
  scope?: number | "public" | "internal" | "private" | null;
}

export function EventScopeBadge({ scope }: EventScopeBadgeProps) {
  switch (scope) {
    case AlcanceEvento.PUBLICO:
    case "public":
      return (
        <Badge variant="scope-public" className="w-fit">
          Público
        </Badge>
      );

    case AlcanceEvento.INTERNO:
    case "internal":
      return (
        <Badge variant="scope-internal" className="w-fit">
          Interno
        </Badge>
      );

    case AlcanceEvento.PRIVADO:
    case "private":
      return (
        <Badge variant="scope-private" className="w-fit">
          Privado
        </Badge>
      );

    default:
      return (
        <Badge variant="neutral" className="w-fit">
          No especificado
        </Badge>
      );
  }
}