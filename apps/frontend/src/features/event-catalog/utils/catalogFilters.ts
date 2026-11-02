import type {
  CatalogActivityApi,
  CatalogEventApi,
} from "../types/eventCatalog.types";

export type DateFilter = "todas" | "hoy" | "semana" | "mes";

function normalizeText(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

export function speakerName(speaker: CatalogActivityApi["ponentes"][number]): string {
  return [speaker.nombre, speaker.apellidoPa, speaker.apellidoMa]
    .filter(Boolean)
    .join(" ");
}

function dateValue(value: string | null | undefined): string | null {
  const found = /^(\d{4}-\d{2}-\d{2})/.exec(value ?? "");
  return found ? found[1] : null;
}

function datePartsToday(): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  return { year: get("year"), month: get("month"), day: get("day") };
}

function isoFromDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function dateRange(filter: DateFilter): { start: string; end: string } | null {
  if (filter === "todas") return null;

  const today = datePartsToday();
  const date = new Date(Date.UTC(today.year, today.month - 1, today.day));
  const start = isoFromDate(date);

  if (filter === "hoy") return { start, end: start };

  if (filter === "mes") {
    const from = new Date(Date.UTC(today.year, today.month - 1, 1));
    const to = new Date(Date.UTC(today.year, today.month, 0));
    return { start: isoFromDate(from), end: isoFromDate(to) };
  }

  const monday = new Date(date);
  monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
  const sunday = new Date(monday);
  sunday.setUTCDate(sunday.getUTCDate() + 6);
  return { start: isoFromDate(monday), end: isoFromDate(sunday) };
}

export function visibleEvents(
  events: CatalogEventApi[],
  search: string,
  selectedDate: DateFilter,
  venue: string,
  speaker: string,
): CatalogEventApi[] {
  const q = normalizeText(search);
  const range = dateRange(selectedDate);

  return events.filter((event) => {
    const activities = event.subEventos ?? [];
    const matchesSearch =
      !q ||
      normalizeText(event.nombre).includes(q) ||
      activities.some(
        (activity) =>
          normalizeText(activity.nombre).includes(q) ||
          (activity.ponentes ?? []).some((person) => normalizeText(speakerName(person)).includes(q)),
      );

    const matchesActivityFilters = activities.some((activity) => {
      const date = dateValue(activity.fecha?.fecha);
      const matchesDate = !range || (date !== null && date >= range.start && date <= range.end);
      const matchesVenue = !venue || activity.recinto?.nombre === venue;
      const matchesSpeaker = !speaker || (activity.ponentes ?? []).some(
        (person) => speakerName(person) === speaker,
      );

      return matchesDate && matchesVenue && matchesSpeaker;
    });

    return matchesSearch && matchesActivityFilters;
  });
}

export function getEventDates(event: CatalogEventApi): string[] {
  return (event.subEventos ?? [])
    .map((activity) => dateValue(activity.fecha?.fecha))
    .filter((value): value is string => value !== null)
    .sort();
}

export function formatCatalogDate(value: string): string {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

export function formatCatalogTime(value: string): string {
  return value.slice(0, 5);
}
