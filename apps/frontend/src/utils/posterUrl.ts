/**
 * Valida y normaliza la URL de un póster recibida desde el backend o una previsualización local.
 * El frontend nunca construye URLs de almacenamiento; si recibe una key sin resolver, devuelve null.
 */
export function resolverUrlPoster(valor?: string | null): string | null {
  const limpio = valor?.trim() ?? "";
  if (!limpio) {
    return null;
  }

  if (/^(https?:\/\/|blob:|data:image\/)/i.test(limpio)) {
    return limpio;
  }

  if (import.meta.env.DEV) {
    console.warn(
      `[resolverUrlPoster] Se recibió una key de póster sin resolver ("${limpio}"). El backend debe enviar la URL completa.`,
    );
  }

  return null;
}
