import { EstadoSubEvento } from "@eventos/shared";
import { apiRequest } from "../../../lib/apiClient";
import type { CatalogEventApi } from "../types/eventCatalog.types";

interface CatalogEventSummary {
  idEvento: number;
}

function todayInMexico(): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const part = (name: string) =>
    parts.find((item) => item.type === name)?.value ?? "";

  return `${part("year")}-${part("month")}-${part("day")}`;
}

export const eventCatalogService = {
  async getEvents(signal?: AbortSignal): Promise<CatalogEventApi[]> {
    const summaries = await apiRequest<CatalogEventSummary[]>(
      "eventos",
      { signal },
    );

    if (!Array.isArray(summaries)) {
      throw new Error("La respuesta de eventos no es válida.");
    }

    if (summaries.length === 0) {
      return [];
    }

    const today = todayInMexico();

    const results = await Promise.allSettled(
      summaries.map((event) =>
        apiRequest<CatalogEventApi>(
          `eventos/${event.idEvento}`,
          { signal },
        ),
      ),
    );

    if (signal?.aborted) {
      throw new DOMException("Solicitud cancelada", "AbortError");
    }

    if (results.every((result) => result.status === "rejected")) {
      throw new Error("No se pudieron cargar los detalles de los eventos.");
    }

    return results.flatMap((result) => {
      if (result.status !== "fulfilled") {
        return [];
      }

      const event = result.value;

      const subEventos = (event.subEventos ?? []).filter((activity) => {
        const date = activity.fecha?.fecha?.slice(0, 10);

        return (
          activity.estado === EstadoSubEvento.ACEPTADO &&
          Boolean(date) &&
          date! >= today
        );
      });

      if (subEventos.length === 0) {
        return [];
      }

      return [{ ...event, subEventos }];
    });
  },
};