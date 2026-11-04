import { DashboardLayout } from "../../../components/templates/DashboardLayout";
import { MainLayout } from "../../../components/templates/MainLayout";

export function EventDetailsLayout() {
  return localStorage.getItem("token") ? <DashboardLayout /> : <MainLayout />;
}
