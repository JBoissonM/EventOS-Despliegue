import { Outlet, useLocation } from "react-router";

import { Navbar } from "../organisms/NavBar/NavBar";
import { getCurrentUserHomePath } from "../../lib/userNavigation";

export function PublicEventLayout() {
  const location = useLocation();
  const homePath = getCurrentUserHomePath();
  const returnUrl = /^\/eventos\/[1-9]\d*(?:\/actividades\/[1-9]\d*)?$/.test(
    location.pathname,
  )
    ? location.pathname
    : null;

  const userRole =
    homePath === "/gestion-espacios"
      ? "admin"
      : homePath === "/subdireccion/menu-principal"
        ? "subdireccion"
        : homePath === "/menu-asistente"
          ? "asistente"
          : "visitante";

  return (
    <div className="flex min-h-screen flex-col bg-eventos-on-primary font-merriweather text-eventos-body-text">
      <Navbar userRole={userRole} returnUrl={returnUrl} />
      <main className="flex-1 px-4 py-6 sm:px-7 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
}
