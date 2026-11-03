---
caso_de_uso: "CU-19"
nombre: "Cancelar su asistencia (extend CU-18)"
actor: "Asistente"
proyecto: "EventOS"
version: "2.0"
tags:
  - caso-de-uso
  - ads
  - eventos
---

# CU-19: Cancelar su asistencia (extend CU-18)

> [!NOTE] Navegación
> - [Índice de Casos de Uso](./00-Indice-Casos-de-Uso.md)
> - [Requerimientos y Reglas de Negocio](../01-Requerimientos-y-Reglas-de-Negocio.md)
> - [Catálogos de Pantallas y Mensajes](../02-Actores-y-Catalogos.md)

**Resumen:** Permite al Asistente cancelar su asistencia a un evento al que ya cuenta con una reserva activa.

**Descripción:**

| Atributo | Especificación |
| :--- | :--- |
| **Caso de uso** | **CU-19 Cancelar su asistencia (extend CU-18)** |
| **Autor** | Santiago Jaimes Jaramillo |
| **Actor** | Asistente |
| **Propósito** | Permitir al Asistente cancelar su reserva de lugar en un evento, liberando el cupo o lugar ocupado. |
| **Entradas** | • Se selecciona el evento desde el listado de "Consultar sus eventos".<br>• Se confirma la cancelación mediante el botón [Aceptar]. |
| **Salidas** | • Se mostrará en pantalla el mensaje **MSG-I-08** "Operación realizada con éxito." al confirmar la cancelación. |
| **Precondiciones** | • Que el sistema se encuentre en el punto de extensión de "Consultar sus eventos".<br>• Que el asistente cuente con una reserva activa para el evento seleccionado. |
| **Postcondiciones** | • Se actualiza el estado de la reserva a "Cancelada" en la base de datos y se libera el cupo o lugar específico ocupado.<br>• El boleto digital asociado a la reserva cancelada queda invalidado y su código QR no podrá utilizarse para ingresar al evento. |
| **Errores** | • Se mostrará el **MSG-E-01** "El evento ya ha concluido." cuando el asistente intente cancelar su asistencia a un evento ya finalizado. |
| **Tipo** | Secundario para el actor Asistente, viene del caso de uso **CU-18** Consultar sus eventos. |

**Trayectorias del caso de uso:**


### Trayectoria Principal

1. Selecciona un evento con reserva activa desde **UI08** “Consultar Sus Eventos (Reservas del Asistente)”.
2. Selecciona la opción “Cancelar su asistencia” en **UI08** “Consultar Sus Eventos (Reservas del Asistente)”.
3. Muestra un mensaje de confirmación: “¿Deseas cancelar tu asistencia a este evento?” en **UI08** “Consultar Sus Eventos (Reservas del Asistente)”.
4. Oprime el botón [Confirmar]. [Trayectoria A] [Trayectoria B]
5. Actualiza el estado de la reserva a "Cancelada".
6. Libera el cupo o lugar específico ocupado.
7. Muestra en **UI08** el **apartado** “Consultar Sus Eventos (Reservas del Asistente)”.

*Fin de la trayectoria.*


### Trayectoria alternativa A:

> **Condición:** El Asistente decide no cancelar su asistencia.

- **A-1.** Oprime el botón [Cancelar].
- **A-2.** Conserva la reserva en estado "Activa".

*Fin de la trayectoria.*


### Trayectoria alternativa B:

> **Condición:** El evento seleccionado ya concluyó.

- **B-1.** Detecta que el evento seleccionado ya concluyó.
- **B-2.** Muestra MSG-E-01 “El evento ya ha concluido”.
- **B-3.** Mantiene las reservas sin modificaciones y regresa a UI08.

*Fin de la trayectoria.*
