import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { MainLayout } from "../components/templates/MainLayout";
import { PublicEventLayout } from "../components/templates/PublicEventLayout";
import { DashboardLayout } from "../components/templates/DashboardLayout";
import { ProtectedRoute } from "../app/ProtectedRoutes";

import { LoginForm } from "../features/auth/LoginForm";
import { Registro } from "../features/auth/Registro";

import { SolicitudEvento } from "../features/events/SolicitudEventos";
import { DetallesSolicitud } from "../features/educational-services/DetallesSolicitud";
import { ListadoSolicitudes } from "../features/educational-services/ListadoSolicitudes";
import { MenuSubdireccion } from "../features/educational-services/MenuSubdireccion";
import { SolicitudesAprobadas } from "../features/educational-services/SolicitudesAprobadas";
import { Perfil } from "../features/account/miPerfil";
import { Verificacion } from "../features/account/verificacion";
import { JefeDepartamento } from "../features/admin/JefeDepartamento";
import { GestionUsuarios } from "../features/admin/Gestion-Usuarios";
import { BitacoraGeneral } from "../features/admin/Bitacora";
import { MenuPrincipalAdministracion } from "../features/admin/menu-admin";

import { MenuAsistente } from "../features/assistant/menu-asistente";
import { MyTicketsRoute } from "../features/tickets/pages/MyTicketsRoute";
import { DigitalTicketRoute } from "../features/tickets/pages/DigitalTicketRoute";

import { GestionEspacios } from "../features/admin/Gestion-Espacios";
import { GestionEquipos } from "../features/admin/Gestion-Equipos";

import { ReservationRoute } from "../features/event-details/pages/ReservationRoute";

import { EventDetailsRoute } from "../features/event-details/pages/EventDetailsRoute";
import { SubEventDetailsRoute } from "../features/event-details/pages/SubEventDetailsRoute";
import { EventCatalogPage } from "../features/event-catalog/pages/EventCatalogPage";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/registro" element={<Registro />} />

          <Route
            path="/detalles-solicitud/"
            element={<DetallesSolicitud />}
          />
        </Route>

        <Route element={<PublicEventLayout />}>
          <Route path="/cartelera" element={<EventCatalogPage />} />
          <Route path="/asistente/cartelera" element={<EventCatalogPage />} />
          <Route
            path="/eventos/:idEvento"
            element={<EventDetailsRoute />}
          />
          <Route
            path="/eventos/:idEvento/actividades/:idSubEvento"
            element={<SubEventDetailsRoute />}
          />
          <Route
            path="/eventos/:idEvento/actividades/:idSubEvento/reservar"
            element={<ReservationRoute />}
          />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["Administrador", "Subdirección", "Asistente", "Usuario Externo", "Usuario Interno"]} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/perfil" element={<Perfil />} />
          </Route>
        </Route>

        <Route
          element={
            <ProtectedRoute
              allowedRoles={[
                "Asistente",
                "Usuario Externo",
                "Usuario Interno"
              ]}
            />
          }
        >
          <Route element={<DashboardLayout />}>
            <Route
              path="/menu-asistente"
              element={<MenuAsistente />}
            />
            <Route path="/asistente/boletos" element={<MyTicketsRoute />} />
            <Route path="/asistente/boletos/:idBoleto" element={<DigitalTicketRoute />} />
            <Route path="/verificacion" element={<Verificacion />} />

            <Route
              path="/solicitud-evento"
              element={<SolicitudEvento />}
            />
          </Route>
        </Route>

        <Route
          element={
            <ProtectedRoute allowedRoles={["Administrador"]} />
          }
        >
          <Route element={<DashboardLayout />}>
            <Route
              path="/gestion-espacios"
              element={<GestionEspacios />}
            />

            <Route
              path="/gestion-equipos/:id"
              element={<GestionEquipos />}
            />
            <Route path="/admin/jefe-departamento" element={<JefeDepartamento />} />
            <Route path="/admin/gestion-usuarios" element={<GestionUsuarios />} />
            <Route path="/admin/bitacora" element={<BitacoraGeneral />} />
            <Route path="/menu-admin" element={<MenuPrincipalAdministracion />} />
          </Route>
        </Route>

        <Route
          element={
            <ProtectedRoute allowedRoles={["Subdirección"]} />
          }
        >
          <Route element={<DashboardLayout />}>
            <Route
              path="/detalles-solicitud/:id"
              element={<DetallesSolicitud />}
            />

            <Route
              path="/subdireccion/lista-solicitudes"
              element={<ListadoSolicitudes />}
            />

            <Route
              path="/subdireccion/menu-principal"
              element={<MenuSubdireccion />}
            />
            <Route path="/subdireccion/solicitudes-aprobadas" element={<SolicitudesAprobadas />} />
          </Route>
        </Route>

        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}