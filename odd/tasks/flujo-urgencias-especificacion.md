# Feature: Flujo Unificado de Urgencias en Especificación EventOS

## Objetivo
Formalizar la política y flujo de urgencias (< 7 días) en la especificación oficial de EventOS (Reglas de Negocio, Requerimientos y Casos de Uso), integrando el ticket Jira SCRUM-543 y la propuesta de Reprogramaciones Extraordinarias.

## Alcance
- `docs/01-Requerimientos-y-Reglas-de-Negocio.md`: Actualizar RF-01, RF-02, RN-23, RN-24, RN-25.
- `docs/03-Casos-de-Uso/CU09-Solicitar-evento.md`: Agregar captura obligatoria de `motivoUrgencia` cuando fecha <= 7 días.
- `docs/03-Casos-de-Uso/CU26-Modificar-logistica-del-evento.md`: Permitir reprogramación urgente (< 7 días) con justificación obligatoria y dictamen de Subdirección.
- `docs/03-Casos-de-Uso/CU04-Consultar-solicitudes-de-eventos.md`: Reflejar badge y priorización en primer lugar de solicitudes urgentes en UI11.
- `docs/03-Casos-de-Uso/CU05-Consultar-datos-de-un-evento.md`: Despliegue de tarjeta de motivo de urgencia/modificación en UI12 para dictamen de Subdirección.

## Checklist de Tareas
- [x] TASK-1: Actualizar `01-Requerimientos-y-Reglas-de-Negocio.md` con RF-01, RF-02 y nueva RN-23 (reprogramación ordinaria vs urgente).
- [x] TASK-2: Actualizar `CU09-Solicitar-evento.md` con entradas, validaciones y trayectoria alternativa de solicitud urgente.
- [x] TASK-3: Actualizar `CU26-Modificar-logistica-del-evento.md` con reprogramación extraordinaria/urgente.
- [x] TASK-4: Actualizar `CU04-Consultar-solicitudes-de-eventos.md` con badge de prioridad urgente en UI11.
- [x] TASK-5: Actualizar `CU05-Consultar-datos-de-un-evento.md` con motivo de urgencia en UI12.
- [x] TASK-6: Validar consistencia y verificar VitePress docs (`bun run docs:build` o verificación de enlaces).
