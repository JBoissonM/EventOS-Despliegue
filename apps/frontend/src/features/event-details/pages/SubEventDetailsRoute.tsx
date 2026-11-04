import { useParams } from "react-router";
import { SubEventDetailsPage } from "./SubEventDetailsPage";
import { EventDetailsRequestState } from "../components/molecules/EventDetailsRequestState";
import { useSubEventDetails } from "../hooks/useSubEventDetails";

function parseId(value: string | undefined): number | null {
  if (!value || !/^\d+$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export function SubEventDetailsRoute() {
  const { idEvento, idSubEvento } = useParams();
  const { activity, status, error, retry } = useSubEventDetails(parseId(idEvento), parseId(idSubEvento));
  if (status !== "success" || !activity) {
    return <EventDetailsRequestState status={status === "success" ? "error" : status} error={error} onRetry={retry} />;
  }
  return <SubEventDetailsPage activity={activity} />;
}
