import { useState } from "react";
import { useNavigate, useParams } from "react-router";

import { SubEventDetailsPage } from "./SubEventDetailsPage";

import { EventDetailsRequestState } from "../components/molecules/EventDetailsRequestState";

import { useSubEventDetails } from "../hooks/useSubEventDetails";

function parseId(value: string | undefined): number | null {
  if (!value || !/^\d+$/.test(value)) {
    return null;
  }

  const id = Number(value);

  return Number.isSafeInteger(id) && id > 0
    ? id
    : null;
}

export function SubEventDetailsRoute() {
  const params = useParams();
  const navigate = useNavigate();

  const idEvento = parseId(params.idEvento);
  const idSubEvento = parseId(params.idSubEvento);

  const {
    activity,
    status,
    error,
    retry,
  } = useSubEventDetails(idEvento, idSubEvento);

  if (status !== "success" || activity === null) {
    return (
      <EventDetailsRequestState
        status={status === "success" ? "error" : status}
        error={error}
        onRetry={retry}
        returnUrl={
          idEvento === null || idSubEvento === null
            ? undefined
            : `/eventos/${idEvento}/actividades/${idSubEvento}`
        }
      />
    );
  }

  const handleReserve = (idSubEvento: number) => {
    navigate(
      `/eventos/${activity.idEvento}/actividades/${idSubEvento}/reservar`,
    );
  };

  const handleBack = () => {
    navigate(`/eventos/${activity.idEvento}`);
  };

  return (
    <>
      <SubEventDetailsPage
        activity={activity}
        onBack={handleBack}
        onReserve={handleReserve}
      />
    </>
  );
}