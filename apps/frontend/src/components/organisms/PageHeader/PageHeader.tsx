import type { MouseEvent } from "react";
import { PageBackLink } from "../../molecules/PageBackLink";

type PageHeaderProps = {
  title: string;
  description?: string;
  back?: {
    to: string;
    label: string;
    onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
  };
};

export function PageHeader({
                             title,
                             description,
                             back,
                           }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-4">
      {back && (
        <PageBackLink
          to={back.to}
          label={back.label}
          onClick={back.onClick}
        />
      )}

      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-eventos-ink">
          {title}
        </h1>

        {description && (
          <p className="text-sm text-eventos-muted-text">
            {description}
          </p>
        )}
      </div>
    </header>
  );
}