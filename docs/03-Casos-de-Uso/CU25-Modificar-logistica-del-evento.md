---
caso_de_uso: "CU-25"
nombre: "Modificar logística (fecha, hora, espacio) del evento (extend CU-24)"
actor: "Organizador"
proyecto: "EventOS"
version: "2.0"
tags:
  - caso-de-uso
  - ads
  - eventos
---

# CU-25: Modificar logística (fecha, hora, espacio) del evento (extend CU-24)

> [!NOTE] Navegación
> - [Índice de Casos de Uso](./00-Indice-Casos-de-Uso.md)
> - [Requerimientos y Reglas de Negocio](../01-Requerimientos-y-Reglas-de-Negocio.md)
> - [Catálogos de Pantallas y Mensajes](../02-Actores-y-Catalogos.md)

**Resumen:**

Permite al Organizador reprogramar o reubicar un evento previamente creado, actualizando su fecha, horario o recinto, requiriendo obligatoriamente una justificación, validando que el nuevo aforo cubra las reservas activas y notificando a los asistentes. Si la modificación involucra fechas dentro de los próximos 7 días naturales, se cataloga como modificación con prioridad urgente para dictamen de Subdirección (RN-23, RN-31).

**Descripción:**

| Atributo | Especificación |
| :--- | :--- |
| **Caso de uso** | **CU-25 Modificar logística (fecha, hora, espacio) del evento (extend CU-24)** |
| **Autor** | Jorge Eduardo Boisson Martínez |
| **Actor** | Organizador |
| **Propósito** | Actualizar la logística del evento, garantizando que los asistentes estén informados y que no existan empalmes de infraestructura y horario en la escuela. |
| **Entradas** | Nueva fecha, nueva hora de inicio/fin, nuevo espacio físico. Motivo de posposición o cambio de recinto. |
| **Salidas** | Ventana modal para ingreso de motivo, mensajes de confirmación visual **MSG-I-08** / **MSG-I-09** y mensaje de error **MSG-E-03** ante aforo insuficiente. |
| **Precondiciones** | El usuario debe haber consultado sus eventos y haber seleccionado el botón Modificar en la pantalla **UI14**. |
| **Postcondiciones** | El evento actualiza sus datos logísticos. El sistema libera el espacio físico anterior y ocupa el nuevo. El estado del evento se mantiene en “Aprobado” o cambia a “Pendiente” (**RN-31**). Si la modificación aprobada incluye cambio de recinto en subeventos con boletos reservados, los boletos conservan su estado válido (`EstadoBoleto.VALIDO`) desvinculando la asignación de asiento (`idAsiento = null`) hacia admisión general, notificando por correo electrónico a los asistentes. |
| **Errores** | • **MSG-E-11** "Por favor, completa todos los campos obligatorios resaltados para continuar".<br>• **MSG-E-24** "El lugar seleccionado ya no se encuentra disponible.".<br>• **MSG-E-03** "La cantidad solicitada excede el límite disponible." cuando el aforo del nuevo recinto sea menor a los boletos activos ya reservados.<br>• **MSG-E-14** "La descripción excede el límite máximo de caracteres permitidos". |
| **Tipo** | Extensión de **CU-24** (`<<extend>>`). |

**Trayectorias del caso de uso:**


### Trayectoria Principal

1. Selecciona “Ver detalles” en la **pantalla UI14** Panel Consultar Mis Eventos.
2. Cambia a la **pantalla UI15 Panel de Administración y Detalles del Evento**. Despliega el formulario con los datos logísticos actuales. Muestra las opciones de recintos filtradas por disponibilidad.
3. Ingresa la nueva fecha, ajusta el recinto y/o horario y da click en el botón de guardar cambios. [Trayectoria A]
4. Muestra el modal exigiendo un motivo para el cambio (**RN-25**).
5. Escribe la justificación y confirma la acción. [Trayectoria B] [Trayectoria C]
6. Verifica el tiempo de anticipación (**RN-23**, **RN-31**); si la reprogramación ocurre con menos de 7 días naturales o propone fechas dentro de ese intervalo, cataloga la solicitud con prioridad urgente [Trayectoria E]. Valida la disponibilidad para evitar colisiones (**RN-06**, **RN-10**) [Trayectoria D], comprueba que el aforo del nuevo recinto cubra las reservas activas existentes [Trayectoria F] y comprueba si la duración total o recinto difiere de lo aprobado. [Trayectoria A]
7. Guarda los cambios o actualiza la solicitud *in-flight*, mantiene vigentes las reservas y boletos de los asistentes notificando la reprogramación, y muestra el mensaje de confirmación correspondiente (**MSG-I-08** o **MSG-I-09**).

*Fin de la trayectoria.*


### Trayectoria alternativa A:

> **Condición:** Extensión de la duración del evento (**RN-31**).

- **A-1.** Detecta que el bloque de horario difiere de la duración original aprobada.
- **A-2.** Actualiza los datos logísticos en la base de datos y revoca la aprobación, cambiando el estado del evento a "Pendiente" para revisión por la Subdirección.
- **A-3.** Envía la notificación correspondiente a los asistentes y muestra el mensaje **MSG-I-09**: "Operación realizada con éxito. Evento en espera de revisión debido a cambio de duración."

*Fin de la trayectoria.*


### Trayectoria alternativa B:

> **Condición:** Ocurre al presionar el botón guardar con campos vacíos.

- **B-1.** Detecta que el campo de motivo está vacío.
- **B-2.** Resalta el área de texto en el modal y muestra el mensaje **MSG-E-11**: "Por favor, completa todos los campos obligatorios resaltados para continuar."
- **B-3.** Mantiene la ventana modal activa hasta que se ingrese el texto o se cancele la acción.

*Fin de la trayectoria.*


### Trayectoria alternativa C:

> **Condición**: Ocurre si el nombre del evento o la descripción del evento supera la longitud permitida.

- **C-1.** Detecta que la longitud del texto sobrepasa el límite máximo establecido.
- **C-2.** Muestra en el modal el mensaje **MSG-E-14**: "La descripción excede el límite máximo de caracteres permitidos"
- **C-3.** Bloquea la confirmación y resalta el campo en rojo.

*Fin de la trayectoria.*


### Trayectoria alternativa D:

> **Condición:** Ocurre cuando el recinto seleccionado ya fue apartado por otro evento en el mismo intervalo de tiempo o no cuenta con disponibilidad operativa.

- **D-1.** Detecta una colisión de horarios o falta de disponibilidad en el recinto seleccionado (**RN-06**, **RN-10**).
- **D-2.** Muestra en la pantalla **UI16** el mensaje **MSG-E-24**: "El lugar seleccionado ya no se encuentra disponible."
- **D-3.** Permite al usuario seleccionar un recinto alternativo o ajustar el horario.

*Fin de la trayectoria.*


### Trayectoria alternativa E: Reprogramación con menos de 7 días naturales (Modificación Urgente)

> **Condición:** Ocurre en el paso 6 cuando la fecha actual del evento o la nueva fecha propuesta cuenta con una antelación menor o igual a 7 días naturales (**RN-23**, **RN-31**).

- **E-1.** El sistema detecta la proximidad de la fecha y clasifica la solicitud de modificación con prioridad urgente (`esUrgente = true`).
- **E-2.** Registra o actualiza la solicitud *in-flight* en estado "Pendiente de Evaluación", conservando el motivo obligatorio capturado en el modal.
- **E-3.** Conserva intactos los boletos y lugares ya reservados por los asistentes hasta el dictamen definitivo de Subdirección.
- **E-4.** Envía aviso prioritario de reprogramación en revisión a los asistentes y muestra en pantalla el mensaje **MSG-I-09**: "Operación realizada con éxito. Evento en espera de revisión debido a cambio de duración." (o reprogramación logística urgente).

*Fin de la trayectoria.*


### Trayectoria alternativa F: Aforo del nuevo recinto insuficiente para reservas activas

> **Condición:** Ocurre en el paso 6 cuando el Organizador solicita reubicar un subevento a un nuevo espacio físico cuya capacidad máxima es menor que la cantidad de boletos activos ya reservados (**RN-31**, **RN-40**).

- **F-1.** El sistema detecta que la capacidad máxima del recinto propuesto es menor que el número de reservas activas emitidas para el subevento.
- **F-2.** Muestra en pantalla el mensaje de error **MSG-E-03**: "La cantidad solicitada excede el límite disponible.", alertando que no es posible seleccionar un espacio con capacidad inferior a los boletos ya reservados.
- **F-3.** Bloquea el guardado de la solicitud de modificación y mantiene el formulario activo para que el Organizador elija un recinto con capacidad suficiente o conserve el recinto actual.

*Fin de la trayectoria.*
