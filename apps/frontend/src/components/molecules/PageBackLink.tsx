import { ArrowLeft } from "lucide-react";
import { Link } from "react-router";
import type { MouseEvent } from "react";

type PageBackLinkProps = {
  to: string;
  label: string;
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
};

export function PageBackLink({ to, label, onClick }: PageBackLinkProps) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="inline-flex w-fit items-center gap-2 font-semibold text-eventos-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-eventos-primary"
    >
      <ArrowLeft size={18} aria-hidden="true" />
      <span>{label}</span>
    </Link>
  );
}
