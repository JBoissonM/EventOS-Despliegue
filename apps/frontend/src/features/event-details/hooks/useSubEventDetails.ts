import type {
  SubEventDetailsViewModel,
} from "../types/eventDetails.types";

import {
  useDetailsResource,
  type DetailsLoader,
} from "./useDetailsResource";

export type SubEventDetailsLoader =
  DetailsLoader<SubEventDetailsViewModel>;

export function useSubEventDetails(
  idSubEvento: number | null,
  loadSubEvent: SubEventDetailsLoader,
) {
  const {
    data,
    status,
    error,
    retry,
  } = useDetailsResource(
    idSubEvento,
    loadSubEvent,
  );

  return {
    activity: data,
    status,
    error,
    retry,
  };
}