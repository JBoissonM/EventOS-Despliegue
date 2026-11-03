---
proyecto: "EventOS"
materia: "Análisis y Diseño de Sistemas"
version: "2.0"
figma_file: "16hWE2vpbC6m8HG15tL2V1"
tags:
  - apunte
  - escuela
  - ads
  - eventos
  - diseno-ui
  - wireframes
  - mockups
---

# Diseño de Interfaces de Usuario (Guía de Estilo, Wireframes y Mockups) — EventOS

> [!NOTE] Fuente Oficial de Diseño (Figma)
> - **Archivo Figma:** [DISEÑO-ADS (`16hWE2vpbC6m8HG15tL2V1`)](https://www.figma.com/design/16hWE2vpbC6m8HG15tL2V1/DISE%C3%91O-ADS)
> - **Lienzos incluidos:** `GUIAS DE ESTILO`, `WIREFRAME` (baja/media fidelidad) y `MOCKUPS` (alta fidelidad Desktop `1512×982` y Móvil `430×932`).
> - **Navegación:** [Hub del Proyecto](./00-Proyecto-EventOS.md) | [Catálogo de Pantallas (`UI01`–`UI37`)](./02-Actores-y-Catalogos.md#3-catalogo-oficial-de-pantallas-ui01--ui37) | [Casos de Uso (`CU-01`–`CU-38`)](./03-Casos-de-Uso/00-Indice-Casos-de-Uso.md)

---

## 1. Guía de Estilo y Sistema de Diseño (`GUIAS DE ESTILO`)

![Guía de Estilo General EventOS](./assets/figma/style-guide-general.png)

### 1.1. Escala Tipográfica (`Merriweather`)
Toda la interfaz utiliza la familia tipográfica **Merriweather**, respetando la jerarquía semántica y de accesibilidad (un único `H1` por pantalla):

| Nivel / Token | Fuente y Peso | Tamaño | Reglas de Uso en Interfaz |
| :--- | :--- | :---: | :--- |
| **`H1` — Títulos Principales** | `Merriweather Bold` | `36 px` | Exclusivo para el título principal de cada pantalla y el logotipo tipográfico `"Event-Os"` en el `Navbar`. Solo debe existir un `H1` por vista. |
| **`H2` — Subtítulos de Sección** | `Merriweather SemiBold` | `24 px` | Encabezados de bloques o secciones internas con énfasis visual (ej. secciones dentro de *Detalles del evento* o paneles de métricas). |
| **`H3` — Tarjetas y Formularios** | `Merriweather Medium` | `20 px` | Títulos principales dentro de tarjetas de eventos/recintos, etiquetas de campos en formularios (`Nombre:`, `Ocupación:`) y avisos de estado vacío (`Sin eventos asignados`). |
| **`Cuerpo` — Texto General** | `Merriweather Regular` | `16 px` | Descripciones extensas, trayectoria de ponentes, justificaciones de beneficio politécnico, celdas de tablas y controles de filtrado. |
| **`Botones` — Acciones** | `Merriweather Bold` | `16 px` | Texto interno de botones primarios, secundarios y semánticos. |
| **`Nota` — Metadatos** | `Merriweather Regular` | `12 px` | Textos auxiliares, leyendas de ayuda, contadores y metadatos secundarios. |

### 1.2. Paleta de Colores Institucional y Semántica

| Token / Rol | Hex | Uso en Componentes |
| :--- | :---: | :--- |
| **Primario Institucional (Guinda IPN)** | `#5F1B36` | `BtnPrimario` (acciones principales como *Reservar lugar*, *Siguiente*), barra de navegación y acentos principales. |
| **Secundario Institucional (Azul Petróleo ESCOM)** | `#1B585F` | Bordes de `InputText` y `Selector` (`2 px` sólido interior, `border-radius: 6 px`), texto de énfasis secundario e iconos. |
| **Superficie Cálida (Guinda Claro)** | `#EDD5D6` | Fondos suaves de tarjetas destacadas, cabeceras de tabla y contenedores secundarios. |
| **Superficie Fría (Petróleo Claro)** | `#B7D6D9` | Badges informativos, resaltados secundarios y estados seleccionados en mapas/tablas. |
| **Superficie Neutra** | `#E9E9E9` | Fondos de página, divisores y contenedores inactivos. |
| **Base / Relleno de Controles** | `#FFFFFF` | Fondo de formularios, modales y relleno de campos `InputText`. |
| **Semántico — Éxito (`BtnExito`)** | `#338315` | Aprobar solicitud en Subdirección, confirmar guardado exitoso y pantalla móvil `"Acceso Válido"` en escáner QR. |
| **Semántico — Error / Destructivo (`BtnError`)** | `#AD3343` | Cancelar evento/asistencia, rechazar solicitud, eliminar registros y pantalla `"Acceso Denegado"` (QR inválido o duplicado). |
| **Semántico — Advertencia (`BtnAdvertencia`)** | `#CDCD36` | Indicadores de recinto/equipo en `"Mantenimiento"` y modales de precaución antes de descartar cambios. |

### 1.3. Resoluciones y Lineamientos de Componentes
- **Desktop:** Lienzo base `1512 × 982 px` (MacBook Pro 14"), extensible verticalmente (`1205 px` – `2005 px`) en formularios multi-actividad y paneles extensos.
- **Móvil Responsivo:** Lienzo `430 × 932 px` (priorizado para consulta de reservas `UI08`, boleto digital `UI09`, eventos asignados `UI17` y escáner QR `UI18`).
- **Iconografía:** Librería NextIcons (`https://www.nexticons.com/icons`) y Bootstrap Icons (`bi:*`).

---

## 2. Correspondencia entre Catálogo Oficial (`v2.0`) y Lienzos de Figma

Durante la consolidación de la **Versión 2.0** se reasignaron algunos códigos `UI` para evitar colisiones (ver [Notas de Consolidación](./02-Actores-y-Catalogos.md#7-notas-de-consolidacion-version-20)). La siguiente tabla vincula cada pantalla normativa `v2.0` con el nombre exacto de su frame en Figma:

| ID Oficial (`v2.0`) | Nombre Oficial (`v2.0`) | Etiqueta del Frame en Figma | Wireframe | Mockup |
| :---: | :--- | :--- | :---: | :---: |
| `UI01` | Pantalla de Inicio de Sesión | `UI01 Pantalla de Inicio de Sesión` | Sí | Sí |
| `UI02` | Pantalla de Registro de Usuario | `UI02 Pantalla de Registro de Usuario` | Sí | Sí |
| `UI03` | Menú Principal del Asistente | `UI03 Menú principal del asistente` | Sí | Sí |
| `UI04` | Cartelera de Eventos | `UI04 Cartelera de Eventos (Sin cuenta / Para el Asistente)` | Sí | Sí |
| `UI05` | Detalles del Evento (+ subvista `UI05.1`) | `UI05 Detalles del evento` y `UI05.1 Detalles del subevento` | Sí | Sí |
| `UI06` | Mapa de Asientos y Disponibilidad del Recinto | `UI06 Mapa de Asientos y Disponibilidad del recinto` | Sí | Sí |
| `UI07` | Formulario de Solicitud de Evento | `UI07 Formulario de Solicitud de Evento` (Asistente y Subdirección) | Sí | Sí |
| `UI08` | Consultar Mis Eventos | `UI08 Consultar sus Eventos (Reservas del asistente)` (Desktop y Móvil) | Sí | Sí |
| `UI09` | Boleto Digital y Código QR | `UI09 Boleto Digital y Código QR` (Auditorio, Lab, Sala 14 y Móvil) | Sí | Sí |
| `UI10` | Bitácora de Eventos Realizados | `UI10 Bitácora de Eventos Realizados` | Sí | En proceso |
| `UI11` | Panel de Solicitudes Pendientes | `UI11 Panel de Solicitudes Pendientes (Subdirección)` | Sí | Sí |
| `UI12` | Detalles del Evento para Evaluación | `UI12 Detalles de Evento para evaluación (Subdirección)` | Sí | Sí |
| `UI13` | Panel de Eventos | `UI13 Panel de Eventos Aprobados (Subdirección)` | Sí | Sí |
| `UI14` | Panel de Consulta de Mis Eventos | `UI14 Panel Consultar Mis Eventos (Organizador)` | Sí | Sí |
| `UI15` | Panel de Administración y Detalles del Evento | `UI15 Administración y Detalles de mi evento` (General, Multi-actividad, Privado) | — | Sí |
| `UI16` | Formulario de Modificación de Evento | `UI16 Administración y Detalles de mi evento` / `Formulario de Modificación` | Sí | Sí |
| `UI17` | Panel de Eventos Asignados *(Logística)* | `UI18 Panel de Eventos Asignados (Logística)` *(nota: `UI17` en Figma muestra Requerimientos Técnicos de Lab)* | Sí | Sí |
| `UI18` | Pantalla de Escáner QR | `UI19 Pantalla de Escáner QR` + `Acceso Válido` / `Acceso Denegado` | Sí | Sí |
| `UI19` | Bitácora Histórica del Sistema | `UI20 Bitácora histórica de eventos / del sistema` | Sí | Sí |
| `UI20` | Gestión de Cuentas de Usuario | `UI21 Gestión de cuentas de usuario` | Sí | Sí |
| `UI21` | Panel de Gestión de Espacios Físicos | `UI22 Panel de Gestión de Espacios Físicos` | Sí | Sí |
| `UI22` | Gestión de Equipos de Laboratorio | `UI23 Gestión de equipos de laboratorio` | Sí | Sí |
| `UI23` | Activación de Cuenta por Token | `UI24 Activación de Cuenta por Token` | Sí | Sí |
| `UI24` | Pantalla de Verificación de Identidad | `UI32 Verificacion` (Estudiante, Profesor, Empresa, Externo) | Sí | Sí |
| `UI25` | Menú Principal de Administrador | `UI25 menú Administrador` | — | Sí |
| `UI26` | Agregar Personal de Logística | `UI27 Agregar personal de logística` | Sí | Sí |
| `UI27` | Visualizar Perfil de Usuario | `UI28 Perfil` | Sí | Sí |
| `UI28` | Agregar Ponente al Evento | Integrado como modal/sección en `UI16` (`Agregar ponentes`) | Sí | Sí |
| `UI30` | Gestionar Estado de Verificación de Usuarios | `UI31 Visualización de verificación de usuario por parte de subdirección` | — | Sí |
| `UI31` | Panel de Supervisión y Calendario Institucional | Agenda institucional integrada en menú directivo (`UI36`) | — | — |
| `UI32` | Registro de Personal de Logística desde Organizador | `UI27 Agregar personal de logística - modal registrar usuario` | Sí | Sí |
| `UI33` | Registro de Usuario desde Administrador | Flujo administrativo equivalente a `UI02` desde `UI20` | — | — |
| `UI34` | Registro de jefe de área | `UI34 Asignar Jefes de departamento` | — | Sí |
| `UI36` | Menú Principal de Subdirección | `UI25 Menú principal del subdirección` | — | Sí |
| `UI37` | Modal de Solicitud de Cambios al Evento | Modal de dictamen y observaciones sobre `UI12` | — | Sí |

---

## 3. Pantallas Universales (`Todos los Actores`)

### 3.1. `UI01` — Pantalla de Inicio de Sesión (`CU-01`)
Autenticación con correo, contraseña y validación anti-bots.

**Wireframe (`UI01`):**
![Wireframe UI01 Inicio de Sesión](./assets/figma/wireframes/wf-ui01-login.png)

**Mockup de Alta Fidelidad (`UI01`):**
![Mockup UI01 Inicio de Sesión](./assets/figma/mockups/mk-ui01-login.png)

---

### 3.2. `UI04` — Cartelera de Eventos (`CU-04`)
Exploración pública y filtrada por fecha, recinto, categoría o ponente, diferenciando sesión sin cuenta y sesión de asistente.

**Wireframe (`UI04`):**
![Wireframe UI04 Cartelera de Eventos](./assets/figma/wireframes/wf-ui04-cartelera.png)

**Mockup — Vista Pública sin Cuenta (`UI04`):**
![Mockup UI04 Cartelera Pública](./assets/figma/mockups/mk-ui04-cartelera-publica.png)

**Mockup — Vista Autenticada para Asistente (`UI04`):**
![Mockup UI04 Cartelera Asistente](./assets/figma/mockups/mk-ui04-cartelera-asistente.png)

---

### 3.3. `UI05` y `UI05.1` — Detalles del Evento y Detalles del Subevento (`CU-05`)
Soporta eventos de una sola sesión, eventos en laboratorios (acceso sin mapa de butacas) y eventos compuestos por múltiples actividades (`UI05.1`).

**Wireframe — Evento General y Multi-actividad (`UI05`):**
![Wireframe UI05 Detalles del Evento](./assets/figma/wireframes/wf-ui05-detalles-evento.png)

![Wireframe UI05 Evento con Varias Actividades](./assets/figma/wireframes/wf-ui05-multiactividad.png)

**Mockups — Evento General, Laboratorio, Multi-actividad y Subevento (`UI05` / `UI05.1`):**
![Mockup UI05 Detalles del Evento](./assets/figma/mockups/mk-ui05-detalles-evento.png)

![Mockup UI05 Evento en Laboratorio](./assets/figma/mockups/mk-ui05-laboratorio.png)

![Mockup UI05 Evento con Varias Actividades](./assets/figma/mockups/mk-ui05-multiactividad.png)

![Mockup UI05.1 Detalles del Subevento](./assets/figma/mockups/mk-ui05-1-subevento.png)

---

### 3.4. `UI27` — Visualizar Perfil de Usuario (`CU-02`)
*(Etiquetada como `UI28 Perfil` en Figma).* Muestra los datos de la cuenta, rol institucional/externo y acceso al estado de verificación de identidad.

**Wireframe (`UI27`):**
![Wireframe UI27 Perfil de Usuario](./assets/figma/wireframes/wf-ui27-perfil.png)

**Mockup (`UI27`):**
![Mockup UI27 Perfil de Usuario](./assets/figma/mockups/mk-ui27-perfil.png)

---

## 4. Pantallas del Actor Asistente

### 4.1. `UI02` — Pantalla de Registro de Usuario (`CU-13`)

**Wireframe (`UI02`):**
![Wireframe UI02 Registro de Usuario](./assets/figma/wireframes/wf-ui02-registro.png)

**Mockup (`UI02`):**
![Mockup UI02 Registro de Usuario](./assets/figma/mockups/mk-ui02-registro.png)

---

### 4.2. `UI03` — Menú Principal del Asistente (`CU-03`, `CU-04`, `CU-18`)
Resumen de próximos eventos agendados y accesos directos a cartelera, reservas y solicitud de eventos.

**Wireframe (`UI03`):**
![Wireframe UI03 Menú Principal Asistente](./assets/figma/wireframes/wf-ui03-menu-asistente.png)

**Mockup (`UI03`):**
![Mockup UI03 Menú Principal Asistente](./assets/figma/mockups/mk-ui03-menu-asistente.png)

---

### 4.3. `UI06` — Mapa de Asientos y Disponibilidad del Recinto (`CU-15`, `CU-16`)
Selección interactiva de butaca en Auditorio y confirmación de reserva (`MSG-I-16`).

**Wireframe (`UI06`):**
![Wireframe UI06 Mapa de Asientos](./assets/figma/wireframes/wf-ui06-mapa-asientos.png)

**Mockups — Selección de Asiento y Confirmación (`UI06`):**
![Mockup UI06 Mapa de Asientos](./assets/figma/mockups/mk-ui06-mapa-asientos.png)

![Mockup UI06 Reserva Confirmada](./assets/figma/mockups/mk-ui06-reserva-confirmada.png)

---

### 4.4. `UI07` — Formulario de Solicitud de Evento (`CU-21`, `CU-11`)
Incluye captura de beneficio politécnico, adición dinámica de tarjetas de subevento/actividad, candado por falta de verificación de identidad (`MSG-E-54`) y variante para Subdirección / Jefes de Academia.

**Wireframe (`UI07`):**
![Wireframe UI07 Solicitar Evento](./assets/figma/wireframes/wf-ui07-solicitar-evento.png)

**Mockup — Formulario General del Solicitante (`UI07`):**
![Mockup UI07 Solicitar Evento](./assets/figma/mockups/mk-ui07-solicitar-evento.png)

**Mockup — Adición de Tarjetas de Subevento (`UI07`):**
![Mockup UI07 Subeventos](./assets/figma/mockups/mk-ui07-subeventos.png)

**Mockup — Bloqueo por Falta de Verificación de Identidad (`UI07` / `MSG-E-54`):**
![Mockup UI07 Bloqueo por Verificación](./assets/figma/mockups/mk-ui07-bloqueo-verificacion.png)

**Mockup — Variante Subdirección y Jefes de Academia (`UI07` / `CU-11`):**
![Mockup UI07 Subdirección](./assets/figma/mockups/mk-ui07-subdireccion.png)

---

### 4.5. `UI08` — Consultar Mis Eventos / Reservas (`CU-18`, `CU-19`)
Visualización de reservas activas (`Activo` / `Ingresado`), acceso al QR y cancelación de asistencia en Desktop y Móvil.

**Wireframe (`UI08`):**
![Wireframe UI08 Consultar Mis Eventos](./assets/figma/wireframes/wf-ui08-mis-eventos.png)

**Mockup Desktop (`UI08`):**
![Mockup UI08 Consultar Mis Eventos Desktop](./assets/figma/mockups/mk-ui08-mis-eventos.png)

**Mockup Móvil (`UI08`):**
![Mockup UI08 Consultar Mis Eventos Móvil](./assets/figma/mockups/mk-ui08-mis-eventos-movil.png)

---

### 4.6. `UI09` — Boleto Digital y Código QR (`CU-17`, `CU-20`)
Boleto digital firmado criptográficamente en variantes Auditorio, Laboratorio y vista Móvil.

**Wireframe (`UI09`):**
![Wireframe UI09 Boleto Digital QR](./assets/figma/wireframes/wf-ui09-boleto-qr.png)

**Mockups — Auditorio, Laboratorio y Móvil (`UI09`):**
![Mockup UI09 Boleto Auditorio](./assets/figma/mockups/mk-ui09-boleto-qr.png)

![Mockup UI09 Boleto Laboratorio](./assets/figma/mockups/mk-ui09-boleto-laboratorio.png)

![Mockup UI09 Boleto Móvil](./assets/figma/mockups/mk-ui09-boleto-movil.png)

---

### 4.7. `UI10` — Bitácora de Eventos Realizados (`CU-14`)
Historial de participación del asistente con filtros por fecha y categoría.

**Wireframes — Listado y Filtros (`UI10`):**
![Wireframe UI10 Bitácora Asistente](./assets/figma/wireframes/wf-ui10-bitacora-asistente.png)

![Wireframe UI10 Filtros de Bitácora](./assets/figma/wireframes/wf-ui10-bitacora-filtros.png)

---

### 4.8. `UI24` — Pantalla de Verificación de Identidad (`CU-21`, `CU-38`)
*(Etiquetada como `UI32 Verificacion` en Figma).* Acreditación trimestral adjuntando comprobante probatorio en PDF (máx. `5 MB`) según tipo de perfil (*Estudiante*, *Profesor*, *Empresa* o *Externo*).

**Wireframe (`UI24`):**
![Wireframe UI24 Verificación de Identidad](./assets/figma/wireframes/wf-ui24-verificacion-identidad.png)

**Mockup — Perfil Estudiante (`UI24`):**
![Mockup UI24 Verificación Estudiante](./assets/figma/mockups/mk-ui24-verificacion-estudiante.png)

**Mockup — Perfil Empresa (`UI24`):**
![Mockup UI24 Verificación Empresa](./assets/figma/mockups/mk-ui24-verificacion-empresa.png)

---

## 5. Pantallas de Subdirección de Servicios Educativos

### 5.1. `UI36` — Menú Principal de Subdirección (`CU-06`, `CU-08`, `CU-11`, `CU-38`)
*(Etiquetada como `UI25 Menú principal del subdirección` en Figma).* Presenta indicadores rápidos (*Solicitudes pendientes*, *Eventos del mes*, *Cuentas por verificar*), la agenda del día por recinto y solicitudes recientes.

**Mockup (`UI36`):**
![Mockup UI36 Menú Principal Subdirección](./assets/figma/mockups/mk-ui36-menu-subdireccion.png)

---

### 5.2. `UI11` — Panel de Solicitudes Pendientes (`CU-06`)

**Wireframe (`UI11`):**
![Wireframe UI11 Solicitudes Pendientes](./assets/figma/wireframes/wf-ui11-solicitudes-pendientes.png)

**Mockup (`UI11`):**
![Mockup UI11 Solicitudes Pendientes](./assets/figma/mockups/mk-ui11-solicitudes-pendientes.png)

---

### 5.3. `UI12` y `UI37` — Detalles del Evento para Evaluación y Dictamen (`CU-07`)
Revisión integral del evento y sus subeventos para aprobar (`MSG-P-03`), rechazar (`MSG-P-04`) o solicitar cambios (`UI37`).

**Wireframe (`UI12`):**
![Wireframe UI12 Evaluación de Evento](./assets/figma/wireframes/wf-ui12-evaluacion-evento.png)

**Mockups — Vista de Evaluación y Modal de Dictamen (`UI12` / `UI37`):**
![Mockup UI12 Evaluación de Evento](./assets/figma/mockups/mk-ui12-evaluacion-evento.png)

![Mockup UI12 Modal de Dictamen](./assets/figma/mockups/mk-ui12-modal-dictamen.png)

---

### 5.4. `UI13` — Panel de Eventos Aprobados (`CU-08`, `CU-09`)

**Wireframe (`UI13`):**
![Wireframe UI13 Eventos Aprobados](./assets/figma/wireframes/wf-ui13-eventos-aprobados.png)

**Mockup (`UI13`):**
![Mockup UI13 Eventos Aprobados](./assets/figma/mockups/mk-ui13-eventos-aprobados.png)

---

### 5.5. `UI30` — Gestionar Estado de Verificación de Usuarios (`CU-38`)
*(Etiquetada como `UI31` en Figma).* Compartida entre Subdirección y Administrador para revisar expedientes PDF y dictaminar la verificación de cuentas (*Alumno*, *Profesor*, *Empresa*).

**Mockup — Listado de Solicitudes de Verificación (`UI30`):**
![Mockup UI30 Listado de Verificación](./assets/figma/mockups/mk-ui30-verificacion-listado.png)

**Mockup — Evaluación de Expediente y Documento Probatorio (`UI30`):**
![Mockup UI30 Detalle de Verificación](./assets/figma/mockups/mk-ui30-verificacion-detalle.png)

---

## 6. Pantallas del Actor Organizador

### 6.1. `UI14` — Panel de Consulta de Mis Eventos (`CU-24`)

**Wireframe (`UI14`):**
![Wireframe UI14 Mis Eventos Organizador](./assets/figma/wireframes/wf-ui14-mis-eventos-org.png)

**Mockup (`UI14`):**
![Mockup UI14 Mis Eventos Organizador](./assets/figma/mockups/mk-ui14-mis-eventos-org.png)

---

### 6.2. `UI15` — Panel de Administración y Detalles del Evento (`CU-24`, `CU-26`, `CU-29`)
Vista consolidada del organizador con datos logísticos, beneficio politécnico, ponentes, personal de logística (`X/10`), acceso a equipos de laboratorio y, en eventos privados, padrón de invitados.

**Mockup — Evento General (`UI15`):**
![Mockup UI15 Administración de Evento](./assets/figma/mockups/mk-ui15-admin-evento.png)

**Mockup — Evento con Varias Actividades (`UI15`):**
![Mockup UI15 Evento Multi-actividad](./assets/figma/mockups/mk-ui15-admin-multiactividad.png)

**Mockup — Evento Privado con Lista de Invitados (`UI15`):**
![Mockup UI15 Evento Privado](./assets/figma/mockups/mk-ui15-admin-privado.png)

---

### 6.3. `UI16` — Formulario de Modificación de Evento (`CU-25`, `CU-27`, `CU-10`)
Permite editar parámetros menores (guardado directo: `"Cambios realizados con éxito"`) y parámetros logísticos mayores (solicitud de revisión: `"Cambios solicitados con éxito"`), gestionar actividades/subeventos, ponentes (`UI28`) y, en eventos privados, administrar invitados con reenvío sujeto a *cooldown* (`"Disponible en 8 horas"`, `RN-29`).

**Wireframe (`UI16`):**
![Wireframe UI16 Modificar Evento](./assets/figma/wireframes/wf-ui16-modificar-evento.png)

**Mockup — Edición de Evento General (`UI16`):**
![Mockup UI16 Modificar Evento](./assets/figma/mockups/mk-ui16-modificar-evento.png)

**Mockup — Edición de Evento con Varias Actividades (`UI16`):**
![Mockup UI16 Modificar Multi-actividad](./assets/figma/mockups/mk-ui16-modificar-multiactividad.png)

**Mockup — Edición de Evento Privado e Invitaciones con Cooldown de 8h (`UI16`):**
![Mockup UI16 Modificar Evento Privado](./assets/figma/mockups/mk-ui16-modificar-privado.png)

---

### 6.4. Consulta de Equipos y Requerimientos Técnicos de Laboratorio (`CU-28`)
*(Etiquetada como `UI17 Requerimientos Tecnicos` en Figma).* Permite al organizador inspeccionar el total de equipos disponibles y fuera de servicio del laboratorio asignado.

![Mockup Requerimientos Técnicos Laboratorio](./assets/figma/mockups/mk-organizador-requerimientos-lab.png)

---

### 6.5. `UI26` y `UI32` — Agregar y Registrar Personal de Logística (`CU-12`, `CU-31`, `CU-32`)
*(Etiquetadas bajo el flujo `UI27` en Figma).* Búsqueda por correo con tope estricto de 10 integrantes (`MSG-E-50`) y modal de registro con invitación por token de 48 horas cuando el correo aún no existe en la plataforma.

**Wireframe (`UI26`):**
![Wireframe UI26 Agregar Personal de Logística](./assets/figma/wireframes/wf-ui26-agregar-logistica.png)

**Mockup — Asignación de Personal de Logística (`UI26`):**
![Mockup UI26 Agregar Personal de Logística](./assets/figma/mockups/mk-ui26-agregar-logistica.png)

**Mockup — Modal para Registrar Nuevo Personal de Logística (`UI32`):**
![Mockup UI32 Modal Registrar Personal de Logística](./assets/figma/mockups/mk-ui32-modal-registrar-logistica.png)

---

## 7. Pantallas del Personal de Logística

### 7.1. `UI23` — Activación de Cuenta por Token (`CU-12`, `CU-32`)
*(Etiquetada como `UI24` en Figma).* Activación de credenciales mediante enlace temporal de 48 horas.

**Wireframe (`UI23`):**
![Wireframe UI23 Activación por Token](./assets/figma/wireframes/wf-ui23-activacion-token.png)

**Mockup (`UI23`):**
![Mockup UI23 Activación por Token](./assets/figma/mockups/mk-ui23-activacion-token.png)

---

### 7.2. `UI17` — Panel de Eventos Asignados (`CU-22`)
*(Etiquetada como `UI18` en Figma).* Disponible en versión Desktop y Móvil.

**Wireframe (`UI17`):**
![Wireframe UI17 Eventos Asignados Logística](./assets/figma/wireframes/wf-ui17-eventos-logistica.png)

**Mockup Desktop (`UI17`):**
![Mockup UI17 Eventos Asignados Desktop](./assets/figma/mockups/mk-ui17-eventos-logistica.png)

**Mockup Móvil (`UI17`):**
![Mockup UI17 Eventos Asignados Móvil](./assets/figma/mockups/mk-ui17-eventos-logistica-movil.png)

---

### 7.3. `UI18` — Pantalla de Escáner QR y Validación de Acceso (`CU-23`)
*(Etiquetada como `UI19` en Figma).* Lectura de cámara en navegador y retroalimentación cromática inmediata (`Acceso Válido` `MSG-I-19` vs. `Acceso Denegado` `MSG-E-22` / `MSG-E-23`).

**Wireframe (`UI18`):**
![Wireframe UI18 Escáner QR](./assets/figma/wireframes/wf-ui18-escaner-qr.png)

**Mockup Desktop (`UI18`):**
![Mockup UI18 Escáner QR Desktop](./assets/figma/mockups/mk-ui18-escaner-qr.png)

**Mockups Móviles — Escáner, Acceso Válido y Acceso Denegado (`UI18`):**
![Mockup UI18 Escáner Móvil](./assets/figma/mockups/mk-ui18-escaner-movil.png)

![Mockup UI18 Acceso Válido](./assets/figma/mockups/mk-ui18-acceso-valido.png)

![Mockup UI18 Acceso Denegado](./assets/figma/mockups/mk-ui18-acceso-denegado.png)

---

## 8. Pantallas del Actor Administrador

### 8.1. `UI25` — Menú Principal de Administrador
Panel central con acceso directo a Gestión de Cuentas, Gestión de Espacios Físicos, Bitácora Histórica y Asignación de Jefes de Departamento.

**Mockup (`UI25`):**
![Mockup UI25 Menú Principal Administrador](./assets/figma/mockups/mk-ui25-menu-admin.png)

---

### 8.2. `UI19` — Bitácora Histórica del Sistema (`CU-37`)
*(Etiquetada como `UI20` en Figma).* Consulta cronológica inmutable con filtrado y exportación en formato PDF.

**Wireframe (`UI19`):**
![Wireframe UI19 Bitácora Histórica](./assets/figma/wireframes/wf-ui19-bitacora-historica.png)

**Mockups — Consulta y Exportación PDF (`UI19`):**
![Mockup UI19 Bitácora Histórica](./assets/figma/mockups/mk-ui19-bitacora-historica.png)

![Mockup UI19 Exportar Bitácora PDF](./assets/figma/mockups/mk-ui19-exportar-pdf.png)

---

### 8.3. `UI20` — Gestión de Cuentas de Usuario (`CU-34`)
*(Etiquetada como `UI21` en Figma).* Directorio de usuarios con filtros y cambio de estatus mediante borrado lógico (`Activo` / `Inactivo`, `MSG-P-05`).

**Wireframe (`UI20`):**
![Wireframe UI20 Gestión de Cuentas](./assets/figma/wireframes/wf-ui20-gestion-cuentas.png)

**Mockups — Listado y Confirmación de Inhabilitación (`UI20`):**
![Mockup UI20 Gestión de Cuentas](./assets/figma/mockups/mk-ui20-gestion-cuentas.png)

![Mockup UI20 Inhabilitación de Cuenta](./assets/figma/mockups/mk-ui20-inhabilitar-cuenta.png)

---

### 8.4. `UI21` — Panel de Gestión de Espacios Físicos (`CU-35`)
*(Etiquetada como `UI22` en Figma).* Control de aforo máximo y estado operativo (`Activo`, `Mantenimiento`, `Inactivo`) de Auditorio, Sala 14 y Laboratorios.

**Wireframe (`UI21`):**
![Wireframe UI21 Gestión de Espacios Físicos](./assets/figma/wireframes/wf-ui21-espacios-fisicos.png)

**Mockup (`UI21`):**
![Mockup UI21 Gestión de Espacios Físicos](./assets/figma/mockups/mk-ui21-espacios-fisicos.png)

---

### 8.5. `UI22` — Gestión de Equipos de Laboratorio (`CU-36`)
*(Etiquetada como `UI23` en Figma).* Administración individual de cómputo funcional, en mantenimiento o inactivo por laboratorio.

**Wireframe (`UI22`):**
![Wireframe UI22 Gestión de Equipos de Laboratorio](./assets/figma/wireframes/wf-ui22-equipos-laboratorio.png)

**Mockup (`UI22`):**
![Mockup UI22 Gestión de Equipos de Laboratorio](./assets/figma/mockups/mk-ui22-equipos-laboratorio.png)

---

### 8.6. `UI34` — Registro y Asignación de Jefes de Área / Departamento (`CU-33`)
Búsqueda por correo institucional o nombre para asignar o revocar jefaturas activas.

**Mockup (`UI34`):**
![Mockup UI34 Asignar Jefes de Departamento](./assets/figma/mockups/mk-ui34-jefes-area.png)
