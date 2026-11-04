import { useParams } from "react-router";
import { EventDetailsPage } from "./EventDetailsPage";
import { EventDetailsRequestState } from "../components/molecules/EventDetailsRequestState";
import { useEventDetails } from "../hooks/useEventDetails";

function parseId(value: string | undefined): number | null {
  if (!value || !/^\d+$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export function EventDetailsRoute() {
  const { idEvento } = useParams();
  const { event, status, error, retry } = useEventDetails(parseId(idEvento));
  if (status !== "success" || !event) {
    return <EventDetailsRequestState status={status === "success" ? "error" : status} error={error} onRetry={retry} />;
  }
  return <EventDetailsPage event={event} />;
}
