# Feature: Unificación del Catálogo Oficial a 35 Pantallas (Sincronía 1:1 con Figma)

**Identificador:** `odd/unificacion-catalogo-ui35/tasks`  
**Estado:** Completado  
**Estrategia de entrega:** `single-pr`  
**TDD:** Desactivado (documentación técnica normativa y especificaciones)

---

## 1. Contexto y Justificación
Durante la reorganización v2.0, el catálogo de interfaces sufrió un desfase por omitir `UI17 Requerimientos Técnicos` (existente en Figma), lo que desplazó la numeración de `UI18` a `UI24`, movió el Menú de Subdirección hasta `UI36`, catalogó un modal como `UI37` y dejó huecos huérfanos en `UI29` y `UI35`.
Se restaura la correspondencia 1:1 con los rótulos oficiales de Figma y la doc base, eliminando falsas pantallas y cerrando el ciclo con la pantalla `UI35` para `CU-39 Restablecer Contraseña`.

---

## 2. Catálogo Oficial Objetivo (`UI01`–`UI35`)
1. `UI01` — Pantalla de Inicio de Sesión
2. `UI02` — Pantalla de Registro de Usuario
3. `UI03` — Menú Principal del Asistente
4. `UI04` — Cartelera de Eventos
5. `UI05` — Detalles del Evento (+ `UI05.1` Detalles del Subevento)
6. `UI06` — Mapa de Asientos y Disponibilidad del Recinto
7. `UI07` — Formulario de Solicitud de Evento
8. `UI08` — Consultar Mis Eventos (Reservas del Asistente)
9. `UI09` — Boleto Digital y Código QR
10. `UI10` — Bitácora de Eventos Realizados
11. `UI11` — Panel de Solicitudes Pendientes (Subdirección)
12. `UI12` — Detalles del Evento para Evaluación (incluye Modal de Solicitud de Cambios)
13. `UI13` — Panel de Eventos Aprobados (Subdirección)
14. `UI14` — Panel de Consulta de Mis Eventos (Organizador)
15. `UI15` — Panel de Administración y Detalles del Evento (Organizador)
16. `UI16` — Formulario de Modificación de Evento (Organizador)
17. `UI17` — Requerimientos Técnicos de Laboratorio
18. `UI18` — Panel de Eventos Asignados (Logística)
19. `UI19` — Pantalla de Escáner QR (Logística)
20. `UI20` — Bitácora Histórica del Sistema (Administrador)
21. `UI21` — Gestión de Cuentas de Usuario (Administrador)
22. `UI22` — Panel de Gestión de Espacios Físicos (Administrador)
23. `UI23` — Gestión de Equipos de Laboratorio (Administrador)
24. `UI24` — Activación de Cuenta por Token (Logística)
25. `UI25` — Menú Principal de Subdirección
26. `UI26` — Menú Principal de Administrador
27. `UI27` — Agregar Personal de Logística
28. `UI28` — Visualizar Perfil de Usuario
29. `UI29` — Agregar Ponente al Evento
30. `UI30` — Panel de Supervisión y Calendario Institucional
31. `UI31` — Gestionar Estado de Verificación de Usuarios
32. `UI32` — Pantalla de Verificación de Identidad
33. `UI33` — Registro de Usuario desde Administrador
34. `UI34` — Asignación de Jefes de Departamento
35. `UI35` — Restablecer Contraseña (`CU-39`)

---

## 3. Plan de Tareas

- [x] **TASK-01:** Actualizar catálogo de actores e interfaces en `Projects/EventOS/docs/02-Actores-y-Catalogos.md`.
- [x] **TASK-02:** Actualizar guía de interfaz, tabla de mapeo y secciones en `Projects/EventOS/docs/04-Diseno-UI.md`.
- [x] **TASK-03:** Crear caso de uso `CU39-Restablecer-contrasena.md` y actualizar `docs/03-Casos-de-Uso/00-Indice-Casos-de-Uso.md` y CUs afectados (`CU-02`, `CU-03`, `CU-05`, `CU-06`, `CU-07`, `CU-08`, `CU-10`, `CU-11`, `CU-12`, `CU-13`, `CU-21`, `CU-22`, `CU-23`, `CU-28`, `CU-31`, `CU-32`, `CU-33`, `CU-34`, `CU-35`, `CU-36`, `CU-37`, `CU-38`).
- [x] **TASK-04:** Sincronizar catálogo normativo y CU-39 en Obsidian (`EventOS_Especificaciones.md` y Requerimientos).
- [x] **TASK-05:** Verificar consistencia total y registrar commit de trabajo.
