import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { MainLayout } from "../components/templates/MainLayout";
import { DashboardLayout } from "../components/templates/DashboardLayout";
import { ProtectedRoute } from "../app/ProtectedRoutes";

import { LoginForm } from "../features/auth/LoginForm";
import { Registro } from "../features/auth/Registro";

import { SolicitudEvento } from "../features/events/SolicitudEventos";
import { DetallesSolicitud } from "../features/educational-services/DetallesSolicitud";
import { ListadoSolicitudes } from "../features/educational-services/ListadoSolicitudes";
import { MenuSubdireccion } from "../features/educational-services/MenuSubdireccion";

import { MenuAsistente } from "../features/assistant/menu-asistente";

import { GestionEspacios } from "../features/admin/Gestion-Espacios";
import { GestionEquipos } from "../features/admin/Gestion-Equipos";

import { ReservationDemoPage } from "../features/reservations/pages/ReservationDemoPage";
import { ReservationAvailabilityPreviewPage } from "../features/reservations/pages/ReservationAvailabilityPreviewPage";

import { MyTicketsDemoPage } from "../features/tickets/pages/MyTicketsDemoPage";
import { DigitalTicketDemoPage } from "../features/tickets/pages/DigitalTicketsDemo";

import { EventDetailsDemoPage } from "../features/event-details/pages/EventDetailsDemoPage";
import { SubEventDetailsDemoPage } from "../features/event-details/pages/SubEventDetailsDemoPage";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/registro" element={<Registro />} />

          <Route
            path="/demo-reservacion"
            element={<ReservationDemoPage />}
          />

          <Route
            path="/demo-boletos"
            element={<MyTicketsDemoPage />}
          />

          <Route
            path="/demo-evento"
            element={<EventDetailsDemoPage />}
          />

          <Route
            path="/demo-actividad/:idSubEvento"
            element={<SubEventDetailsDemoPage />}
          />

          <Route
            path="/detalles-solicitud/"
            element={<DetallesSolicitud />}
          />
        </Route>

        <Route
          path="/demo-boleto"
          element={<DigitalTicketDemoPage />}
        />

        <Route
          path="/demo-disponibilidad/:idSubEvento"
          element={<ReservationAvailabilityPreviewPage />}
        />

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