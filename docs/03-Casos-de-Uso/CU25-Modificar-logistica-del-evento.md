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

Permite al Organizador reprogramar o reubicar un evento previamente creado, actualizando su fecha, horario o recinto, requiriendo obligatoriamente una justificación y notificando a los asistentes.

**Descripción:**

| Atributo | Especificación |
| :--- | :--- |
| **Caso de uso** | **CU-25 Modificar logística (fecha, hora, espacio) del evento (extend CU-24)** |
| **Autor** | Jorge Eduardo Boisson Martínez |
| **Actor** | Organizador |
| **Propósito** | Actualizar la logística del evento, garantizando que los asistentes estén informados y que no existan empalmes de infraestructura y horario en la escuela. |
| **Entradas** | Nueva fecha, nueva hora de inicio/fin, nuevo espacio físico. Motivo de posposición o cambio de recinto. |
| **Salidas** | Ventana modal para ingreso de motivo y mensajes de confirmación visual **MSG-I-08.** |
| **Precondiciones** | El usuario debe haber consultado sus eventos y haber seleccionado el botón Modificar en la pantalla **UI14**. |
| **Postcondiciones** | El evento actualiza sus datos logísticos. El sistema libera el espacio físico anterior y ocupa el nuevo. El estado del evento se mantiene en “Aprobado” o cambia a “Pendiente” (**RN-31**). |
| **Errores** | • **MSG-E-11** "Por favor, completa todos los campos obligatorios resaltados para continuar".<br>• **MSG-E-24** "El lugar seleccionado ya no se encuentra disponible.".<br>• **MSG-E-14** "La descripción excede el límite máximo de caracteres permitidos". |
| **Tipo** | Extensión de **CU-24** (`<<extend>>`). |

**Trayectorias del caso de uso:**


### Trayectoria Principal

1. Selecciona “Ver detalles” en la **pantalla UI14** Panel Consultar Mis Eventos.
2. Cambia a la **pantalla UI15 Panel de Administración y Detalles del Evento**. Despliega el formulario con los datos logísticos actuales. Muestra las opciones de recintos filtradas por disponibilidad.
3. Ingresa la nueva fecha, ajusta el recinto y/o horario y da click en el botón de guardar cambios. [Trayectoria A]
4. Muestra el modal exigiendo un motivo para el cambio (**RN-25**).
5. Escribe la justificación y confirma la acción. [Trayectoria B] [Trayectoria C]
6. Verifica que se cumpla el tiempo de anticipación (**RN-23**, **RN-31**), valida la disponibilidad para evitar colisiones (**RN-06**, **RN-10**) [Trayectoria D] y comprueba si la duración total se mantiene igual a la original. [Trayectoria A]
7. Guarda los cambios, mantiene el estado de “Aprobado”, genera notificaciones internas para los asistentes informando la reprogramación, y muestra el **MSG-I-08** de confirmación.

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
