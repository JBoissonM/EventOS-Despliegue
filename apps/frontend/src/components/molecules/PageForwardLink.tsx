import { ArrowRight } from "lucide-react";
import { Link } from "react-router";
import type { MouseEvent } from "react";

type PageForwardLinkProps = {
  to: string;
  label: string;
  state?: unknown;
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
};

export function PageForwardLink({ to, label, state, onClick }: PageForwardLinkProps) {
  return (
    <Link
      to={to}
      state={state}
      onClick={onClick}
      className="inline-flex w-fit items-center gap-2 font-semibold text-eventos-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-eventos-primary"
    >
      
      <span>{label}</span>
      <ArrowRight size={18} aria-hidden="true" />
    </Link>
  );
}
