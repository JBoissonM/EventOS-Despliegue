import { useState } from "react";
import { useNavigate, useParams } from "react-router";

import { EventDetailsPage } from "./EventDetailsPage";

import { EventDetailsRequestState } from "../components/molecules/EventDetailsRequestState";

import { useEventDetails } from "../hooks/useEventDetails";

function parseEventId(value: string | undefined): number | null {
  if (!value || !/^\d+$/.test(value)) {
    return null;
  }

  const id = Number(value);

  return Number.isSafeInteger(id) && id > 0
    ? id
    : null;
}

function resolvePosterUrl(reference: string | null): string | null {
  if (!reference) {
    return null;
  }

  return /^https?:\/\//i.test(reference)
    ? reference
    : null;
}

export function EventDetailsRoute() {
  const { idEvento: eventIdParam } = useParams();
  const navigate = useNavigate();

  const idEvento = parseEventId(eventIdParam);

  const {
    event,
    status,
    error,
    retry,
  } = useEventDetails(idEvento);

  if (status !== "success" || event === null) {
    return (
      <EventDetailsRequestState
        status={status === "success" ? "error" : status}
        error={error}
        onRetry={retry}
        returnUrl={idEvento === null ? undefined : `/eventos/${idEvento}`}
      />
    );
  }

  const posterUrl = resolvePosterUrl(
    event.posterReferencia,
  );

  const handleViewDetails = (idSubEvento: number) => {
    navigate(
      `/eventos/${event.idEvento}/actividades/${idSubEvento}`,
    );
  };

  const handleReserve = (idSubEvento: number) => {
    navigate(
      `/eventos/${event.idEvento}/actividades/${idSubEvento}/reservar`,
    );
  };

  return (
    <>
      <EventDetailsPage
        event={event}
        posterUrl={posterUrl}
        onBack={() => navigate("/cartelera")}
        onViewDetails={handleViewDetails}
        onReserve={handleReserve}
      />
    </>
  );
}