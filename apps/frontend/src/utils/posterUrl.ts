/**
 * Valida y normaliza la URL de un póster recibida desde el backend o una previsualización local.
 * Soporta URLs absolutas (http/https), blob/data URLs y rutas relativas en entornos hosteados.
 * El frontend nunca construye URLs de almacenamiento arbitrarias; si recibe una key sin resolver, devuelve null.
 */
export function resolverUrlPoster(valor?: string | null): string | null {
  const limpio = valor?.trim() ?? "";
  if (!limpio) {
    return null;
  }

  // Previsualizaciones locales en memoria
  if (/^(blob:|data:image\/)/i.test(limpio)) {
    return limpio;
  }

  // Protocol-relative URLs (ej. //cdn.example.com/poster.jpg)
  if (limpio.startsWith("//")) {
    return `https:${limpio}`;
  }

  // Rutas relativas en el entorno hosteado
  if (limpio.startsWith("/")) {
    try {
      if (typeof window !== "undefined" && window.location?.origin) {
        return new URL(limpio, window.location.origin).toString();
      }
    } catch {
      return limpio;
    }
  }

  // Validar URL absoluta http o https
  try {
    const url = new URL(limpio);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return url.toString();
    }
  } catch {
    // Si la cadena no forma una URL absoluta válida
  }

  if (import.meta.env.DEV) {
    console.warn(
      `[resolverUrlPoster] Se recibió una key o URL de póster no válida ("${limpio}"). El backend debe enviar la URL completa.`,
    );
  }

  return null;
}
