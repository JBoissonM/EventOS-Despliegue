export type QaTestType =
  | "Funcional / Flujo"
  | "Visual / Layout"
  | "Usabilidad / UX"
  | "Datos / Dominio"
  | "Regla de Negocio (Duda abierta)";

export interface QaAnnotationEntry {
  id: string;
  module: string;
  testType: QaTestType;
  suiteId: string;
  route: string;
  summary: string;
}

export const QA_HOST_ENVIRONMENT =
  process.env.E2E_BASE_URL ||
  process.env.FRONTEND_URL ||
  "Entorno Hosteado (Railway / Cloudflare) [E2E local fallback: http://localhost:5173]";

export const QA_BROWSERS = "Mozilla Firefox";

export const QA_ANNOTATIONS: Record<string, QaAnnotationEntry> = {
  "ERR-01": {
    id: "ERR-01",
    module: "Subdirección (UI25)",
    testType: "Visual / Layout",
    suiteId: "subdireccion-login",
    route: "/subdireccion/menu-principal",
    summary:
      "Desalineación entre Agenda y Solicitudes recientes y desbordamiento horizontal por falta de min-w-0 en flex y mx-auto.",
  },
  "ERR-02": {
    id: "ERR-02",
    module: "Notificaciones y Correo",
    testType: "Usabilidad / UX",
    suiteId: "account-verification",
    route: "Correo transaccional (mail.service.ts)",
    summary:
      "Pie visible muestra 'ID Solicitud: <timestamp>' (Date.now()) sin utilidad real para el usuario y confunde frente a [Ref #XXXX].",
  },
  "ERR-03": {
    id: "ERR-03",
    module: "Asistente, Cartelera y Reservas (UI03-UI06)",
    testType: "Usabilidad / UX",
    suiteId: "ticket-reservation",
    route: "/menu-asistente",
    summary:
      "Enlaces 'Ver cartelera completa' y 'Ver mis boletos' sin ícono de flecha (ArrowRight) que indique navegación.",
  },
  "ERR-04": {
    id: "ERR-04",
    module: "Asistente, Cartelera y Reservas (UI03-UI06)",
    testType: "Funcional / Flujo",
    suiteId: "ticket-reservation",
    route: "/eventos/:idEvento/actividades/:idSubEvento/reservar",
    summary:
      "El enlace 'Volver a la actividad' apunta fijo a SubEventDetailsPage (sin EventBanner) en lugar de regresar al evento origen en eventos de 1 actividad.",
  },
  "ERR-05": {
    id: "ERR-05",
    module: "Asistente, Cartelera y Reservas (UI03-UI06)",
    testType: "Usabilidad / UX",
    suiteId: "ticket-reservation",
    route: "/eventos/:idEvento/actividades/:idSubEvento/reservar",
    summary:
      "Faltan íconos en el indicador de lugares disponibles (UsersRound) y en Resumen de reservación (Evento, Actividad, Fecha, Horario, Recinto, Asiento).",
  },
  "ERR-06": {
    id: "ERR-06",
    module: "Subdirección (UI25)",
    testType: "Funcional / Flujo",
    suiteId: "subdireccion-login",
    route: "/subdireccion/menu-principal",
    summary:
      "El filtro 'Todos los espacios' en Agenda del día queda vacío cuando no hay actividades hoy porque no consulta el catálogo de recintos.",
  },
  "ERR-07": {
    id: "ERR-07",
    module: "Subdirección (UI25)",
    testType: "Datos / Dominio",
    suiteId: "subdireccion-login",
    route: "/subdireccion/menu-principal y /perfil",
    summary:
      "La cuenta universal institucional subdireccion@ipn.mx muestra nombre personal ficticio ('Claudia Mendoza García').",
  },
  "ERR-08": {
    id: "ERR-08",
    module: "Verificación vs Cartelera (UI32 / UI04)",
    testType: "Regla de Negocio (Duda abierta)",
    suiteId: "account-verification",
    route: "/verificacion -> /asistente/cartelera",
    summary:
      "[Duda abierta] Usuario con Gmail aprobado como Estudiante/Profesor IPN mantiene tipoCuenta Externo y no visualiza eventos Interno.",
  },
  "ERR-09": {
    id: "ERR-09",
    module: "Organizador y Edición (UI16)",
    testType: "Usabilidad / UX",
    suiteId: "organizer-events",
    route: "/organizador/editar-evento/:idEvento",
    summary:
      "Faltan ayudas/tooltips en Nombre, Descripción, Beneficio, Ponentes y alcance de Logística a nivel evento; ícono Pencil sobrepuesto en TextArea.",
  },
  "ERR-10": {
    id: "ERR-10",
    module: "Perfil y Navegación (UI18 / NavBar)",
    testType: "Funcional / Flujo",
    suiteId: "admin-perfil",
    route: "/panel-eventos-asignados",
    summary:
      "El enlace 'Control de Acceso' se muestra en NavBar a asistentes sin asignaciones activas de logística (RN-44).",
  },
  "ERR-11": {
    id: "ERR-11",
    module: "Perfil y Navegación (UI28)",
    testType: "Visual / Layout",
    suiteId: "admin-perfil",
    route: "/perfil",
    summary:
      "El botón 'Cerrar sesión' usa variante primary (guinda) en lugar de danger (rojo) estipulada en el mockup mk-ui27-perfil.png.",
  },
  "ERR-12": {
    id: "ERR-12",
    module: "Asistente, Cartelera y Reservas (UI03-UI06)",
    testType: "Usabilidad / UX",
    suiteId: "ticket-reservation",
    route: "/cartelera y /menu-asistente",
    summary:
      "Tarjetas de CatalogEventCard sin íconos de Fecha (CalendarDays), Horario (Clock3) ni Espacio (MapPin).",
  },
};

export function logQaAnnotation(errId: string, stepContext: string): void {
  const entry = QA_ANNOTATIONS[errId];
  if (!entry) return;
  console.log(
    `  [QA-ANOTACION][${entry.id}][Modulo: ${entry.module}][Tipo: ${entry.testType}][Ruta: ${entry.route}] ${stepContext} -> ${entry.summary}`,
  );
}

export function printQaSummaryBanner(): void {
  const entries = Object.values(QA_ANNOTATIONS);
  const byModule = new Map<string, QaAnnotationEntry[]>();
  const byType = new Map<QaTestType, number>();

  for (const entry of entries) {
    const list = byModule.get(entry.module) ?? [];
    list.push(entry);
    byModule.set(entry.module, list);
    byType.set(entry.testType, (byType.get(entry.testType) ?? 0) + 1);
  }

  console.log("================================================================================");
  console.log("  ANOTACIONES QA SPRINT 9 (POR MÓDULO Y TIPO DE PRUEBA)");
  console.log(`  Ambiente evaluado : ${QA_HOST_ENVIRONMENT}`);
  console.log(`  Navegadores       : ${QA_BROWSERS}`);
  console.log("  Pruebas Unitarias : 0 fallos reportados (hallazgos corresponden a E2E / Manual UX)");
  console.log("--------------------------------------------------------------------------------");
  console.log("  Conteo por tipo:");
  for (const [type, count] of byType.entries()) {
    console.log(`    - ${type}: ${count}`);
  }
  console.log("--------------------------------------------------------------------------------");
  console.log("  Detalle secuencial por módulo:");
  for (const [mod, items] of byModule.entries()) {
    console.log(`  * ${mod}`);
    for (const item of items) {
      console.log(`      [${item.id}] (${item.testType}) [${item.suiteId}] ${item.summary}`);
    }
  }
  console.log("================================================================================\n");
}
