export function getCatalogOrigin(state: unknown): string | null {
  if (
    typeof state !== "object" ||
    state === null ||
    Array.isArray(state)
  ) {
    return null;
  }

  const value = (state as Record<string, unknown>).catalogReturnTo;

  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//")
  ) {
    return null;
  }

  try {
    const url = new URL(value, window.location.origin);

    if (
      url.origin !== window.location.origin ||
      !["/cartelera", "/asistente/cartelera"].includes(url.pathname)
    ) {
      return null;
    }

    return `${url.pathname}${url.search}`;
  } catch {
    return null;
  }
}