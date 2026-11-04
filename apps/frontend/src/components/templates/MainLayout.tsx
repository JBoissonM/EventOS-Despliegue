import { Link, Outlet } from "react-router";

const keyboardFocus =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-eventos-navbar-focus";

export function MainLayout() {
  return (
    <>
      <header className="bg-eventos-primary shadow-sm">
        <nav
          aria-label="Navegación pública"
          className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 sm:px-6 lg:px-8"
        >
          <span className="font-merriweather text-eventos-brand font-bold tracking-wide text-eventos-on-primary">
            Event-Os
          </span>
          <div className="flex flex-wrap items-center gap-1 sm:gap-3">
            <Link
              to="/login"
              className={`rounded-md px-3 py-2 font-merriweather text-sm font-semibold text-eventos-on-primary transition-colors hover:bg-eventos-action-hover ${keyboardFocus}`}
            >
              Iniciar Sesión
            </Link>
            <Link
              to="/registro"
              className={`rounded-md bg-eventos-on-primary px-3 py-2 font-merriweather text-sm font-semibold text-eventos-primary shadow-sm transition-colors hover:bg-eventos-primary-light ${keyboardFocus}`}
            >
              Registrarse
            </Link>
          </div>
        </nav>
      </header>
      <main className="px-4 py-8 sm:px-7">
        <Outlet />
      </main>
    </>
  );
}

export default MainLayout;
