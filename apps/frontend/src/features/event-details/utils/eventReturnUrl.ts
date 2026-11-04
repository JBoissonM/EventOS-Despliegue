export function getEventReturnPath(value: string | null): string | null {
  if (!value) return null;

  const validPath = /^\/eventos\/[1-9]\d*(?:\/actividades\/[1-9]\d*)?\/?$/.test(value);
  return validPath ? value.replace(/\/$/, "") : null;
}

export function getAuthPathWithReturnUrl(
  authPath: "/login" | "/registro",
  returnPath: string | null,
): string {
  const validReturnPath = getEventReturnPath(returnPath);
  if (!validReturnPath) return authPath;

  const searchParams = new URLSearchParams({ returnUrl: validReturnPath });
  return `${authPath}?${searchParams.toString()}`;
}
