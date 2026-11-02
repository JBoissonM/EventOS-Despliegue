export function getCurrentUserRole(): string | null {
  if (!localStorage.getItem("token")) {
    return null;
  }

  try {
    const user: unknown = JSON.parse(localStorage.getItem("usuario") ?? "null");

    if (
      !user ||
      typeof user !== "object" ||
      !("tipoCuenta" in user) ||
      typeof user.tipoCuenta !== "string"
    ) {
      return null;
    }

    return user.tipoCuenta;
  } catch {
    return null;
  }
}

export function getCurrentUserHomePath(): string | null {
  const role = getCurrentUserRole();

  if (role === "admin" || role === "Administrador") {
    return "/gestion-espacios";
  }

  if (role === "subdireccion" || role === "Subdirección") {
    return "/subdireccion/menu-principal";
  }

  if (
    role === "Asistente" ||
    role === "Usuario Externo" ||
    role === "Usuario Interno"
  ) {
    return "/menu-asistente";
  }

  return null;
}
