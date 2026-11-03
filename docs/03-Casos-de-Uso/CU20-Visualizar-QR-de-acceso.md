---
caso_de_uso: "CU-20"
nombre: "Visualizar QR de acceso (extend CU-18)"
actor: "Asistente"
proyecto: "EventOS"
version: "2.0"
tags:
  - caso-de-uso
  - ads
  - eventos
---

# CU-20: Visualizar QR de acceso (extend CU-18)

> [!NOTE] Navegación
> - [Índice de Casos de Uso](./00-Indice-Casos-de-Uso.md)
> - [Requerimientos y Reglas de Negocio](../01-Requerimientos-y-Reglas-de-Negocio.md)
> - [Catálogos de Pantallas y Mensajes](../02-Actores-y-Catalogos.md)

**Resumen:** Permite al Asistente visualizar el código QR de su boleto digital de un evento con reserva confirmada.

**Descripción:**

| Atributo | Especificación |
| :--- | :--- |
| **Caso de uso** | **CU-20 Visualizar QR de acceso (extend CU-18)** |
| **Autor** | Santiago Jaimes Jaramillo |
| **Actor** | Asistente |
| **Propósito** | Permitir al Asistente visualizar el código QR de su boleto digital para presentarlo al personal de logística el día del evento. |
| **Entradas** | • Se selecciona el evento desde el listado de "Consultar sus eventos". |
| **Salidas** | • Se mostrará en pantalla el código QR del boleto junto con los datos del evento (nombre, fecha, hora, espacio). |
| **Precondiciones** | • Que el sistema se encuentre en el punto de extensión de "Consultar sus eventos".<br>• Que el asistente cuente con una reserva activa y confirmada para el evento seleccionado. |
| **Postcondiciones** | • No se modifican registros en la base de datos, la operación es de solo lectura. |
| **Errores** | • Se mostrará el **MSG-E-06** "Evento no encontrado o cancelado." cuando el evento seleccionado haya sido cancelado después de generarse el boleto. |
| **Tipo** | Secundario para el actor Asistente, viene del caso de uso **CU-18** Consultar sus eventos. |

**Trayectorias del caso de uso:**


### Trayectoria Principal

1. Selecciona un evento con reserva activa desde **UI08** “Consultar Sus Eventos (Reservas del Asistente)”.
2. Selecciona la opción “Visualizar QR de acceso” en **UI08** “Consultar Sus Eventos (Reservas del Asistente)”. [Trayectoria A]
3. Muestra el código QR del boleto junto con los datos del evento en **UI09** “Boleto Digital y Código QR”.

*Fin de la trayectoria.*


### Trayectoria alternativa A:

> **Condición:** El evento fue cancelado después de haberse generado el boleto.

- **A-1.** El sistema detecta que el evento fue cancelado.
- **A-2.** Muestra MSG-E-06 “Evento no encontrado o cancelado”.
- **A-3.** Impide visualizar el código QR y mantiene al asistente en UI08 “Consultar mis eventos”.

*Fin de la trayectoria.*
