import { apiRequest } from "../../../lib/apiClient";
import type { CatalogEventApi } from "../types/eventCatalog.types";

export const eventCatalogService = {
  getEvents(signal?: AbortSignal): Promise<CatalogEventApi[]> {
    return apiRequest<CatalogEventApi[]>("eventos", { signal });
  },
};
