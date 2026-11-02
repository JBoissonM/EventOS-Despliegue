import { useId, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { Menu, X } from "lucide-react";
import { TextLink } from "../../atoms/TextLink/TextLink";

interface NavbarProps {
  userRole: "asistente" | "subdireccion" | "admin" | "visitante";
  returnUrl?: string | null;
}

export function Navbar({ userRole, returnUrl }: NavbarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const mobileMenuId = useId();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getNavLinks = () => {
    switch (userRole) {
      case "asistente":
        return [
          { label: "Menú Principal", to: "/menu-asistente" },
          { label: "Cartelera de eventos", to: "/asistente/cartelera" },
          { label: "Solicitar evento", to: "/solicitud-evento" },
          { label: "Mis Boletos", to: "/asistente/boletos" },
        ];
      case "admin":
        return [
          { label: "Bitácora", to: "/admin/bitacora" },
          { label: "Cuentas de usuario", to: "/admin/usuarios" },
          { label: "Espacios Físicos", to: "/gestion-espacios" },
        ];
      case "visitante":
        return [];
      case "subdireccion":
      default:
        return [
          { label: "Menú", to: "/subdireccion/menu-principal" },
          { label: "Mis eventos", to: "/subdireccion/menu-principal" },
          { label: "Solicitudes Aprobadas", to: "/subdireccion/menu-principal" },
          { label: "Solicitudes Pendientes", to: "/subdireccion/lista-solicitudes" },
          { label: "Solicitar evento", to: "/solicitud-evento" },
        ];
    }
  };

  const navLinks = getNavLinks();

  return (
    <nav className="w-full border-b border-eventos-navbar-divider bg-eventos-primary px-4 py-3 font-merriweather text-eventos-on-primary shadow-md sm:px-6 lg:px-8 lg:py-4" aria-label="Navegación principal">
      <div className="flex items-center justify-between gap-3">
        <span className="shrink-0 font-merriweather text-xl font-bold tracking-wide text-eventos-on-primary">
          Event-Os
        </span>

        {userRole === "visitante" ? (
          <div className="flex items-center gap-1 sm:gap-3">
            <Link
              to="/login"
              state={returnUrl ? { returnUrl } : undefined}
              className="rounded-md px-1.5 py-2 text-xs text-eventos-navbar-link transition-colors hover:text-eventos-on-primary focus-visible:outline-2 focus-visible:outline-eventos-on-primary sm:px-3 sm:text-sm"
            >
              Iniciar Sesión
            </Link>
            <Link
              to="/registro"
              state={returnUrl ? { returnUrl } : undefined}
              className="rounded-md px-1.5 py-2 text-xs text-eventos-navbar-link transition-colors hover:text-eventos-on-primary focus-visible:outline-2 focus-visible:outline-eventos-on-primary sm:px-3 sm:text-sm"
            >
              Registrarse
            </Link>
          </div>
        ) : (
          <>
            <div className="hidden items-center gap-5 lg:flex xl:gap-8">
              <div className="flex items-center gap-5 xl:gap-8">
                {navLinks.map((link) => (
                  <TextLink
                    key={`${link.to}-${link.label}`}
                    to={link.to}
                    className="whitespace-nowrap font-merriweather text-sm font-normal text-eventos-navbar-link no-underline transition-colors hover:text-eventos-on-primary hover:underline"
                  >
                    {link.label}
                  </TextLink>
                ))}
              </div>

              <div className="flex items-center gap-4 border-l border-eventos-navbar-divider pl-4 xl:gap-6">
                {userRole === "asistente" && (
                  <button type="button" className="text-eventos-navbar-link transition-colors hover:text-eventos-on-primary focus-visible:outline-2 focus-visible:outline-eventos-on-primary" aria-label="Notificaciones">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                    </svg>
                  </button>
                )}
                <button type="button" onClick={() => navigate("/perfil")} className="text-eventos-navbar-link transition-colors hover:text-eventos-on-primary focus-visible:outline-2 focus-visible:outline-eventos-on-primary" aria-label="Perfil de usuario">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-7 w-7">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </div>
            </div>

            <button
              type="button"
              aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={mobileMenuOpen}
              aria-controls={mobileMenuId}
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-eventos-navbar-link transition-colors hover:bg-eventos-action-hover focus-visible:outline-2 focus-visible:outline-eventos-on-primary lg:hidden"
            >
              {mobileMenuOpen ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
            </button>
          </>
        )}
      </div>

      {userRole !== "visitante" && (
        <div id={mobileMenuId} className={`${mobileMenuOpen ? "block" : "hidden"} border-t border-eventos-navbar-divider pt-3 lg:hidden`}>
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={`${link.to}-${link.label}`}
                to={link.to}
                aria-current={location.pathname === link.to ? "page" : undefined}
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-md px-3 py-3 text-sm text-eventos-navbar-link transition-colors hover:bg-eventos-action-hover hover:text-eventos-on-primary focus-visible:outline-2 focus-visible:outline-eventos-on-primary aria-[current=page]:bg-eventos-action-hover"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
