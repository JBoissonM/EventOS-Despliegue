---
caso_de_uso: "CU-15"
nombre: "Reservar lugar a un evento"
actor: "Asistente"
proyecto: "EventOS"
version: "2.0"
tags:
  - caso-de-uso
  - ads
  - eventos
---

# CU-15: Reservar lugar a un evento

> [!NOTE] Navegación
> - [Índice de Casos de Uso](./00-Indice-Casos-de-Uso.md)
> - [Requerimientos y Reglas de Negocio](../01-Requerimientos-y-Reglas-de-Negocio.md)
> - [Catálogos de Pantallas y Mensajes](../02-Actores-y-Catalogos.md)

**Resumen:** El asistente tendrá la capacidad de reservar un asiento para un evento de su interés con su respectivo pase de entrada.

**Descripción:**

| Atributo | Especificación |
| :--- | :--- |
| **Caso de uso** | **CU-15 Reservar lugar a un evento** |
| **Autor** | Vazquez Perez Axel Daniel |
| **Actor** | Asistente |
| **Propósito** | Permitir a los asistentes registrarse en un evento de su interés y obtener una entrada que le asegura un lugar en el evento. |
| **Entradas** | Selección del evento de interés.<br>Selección de asiento (de ser el caso). |
| **Salidas** | • Se muestra en pantalla el MSG-I-16 “Operación exitosa, su reserva se ha generado correctamente.”<br>• Se genera el boleto digital.<br>• Envío por correo electrónico al Asistente del pase digital y el código QR del boleto confirmado. |
| **Precondiciones** | Para completar la reserva, el Asistente debe contar con una sesión activa; el visitante puede iniciar desde UI05 pero será redirigido a UI01 o UI02 para autenticarse. El evento debe estar activo, requerir boleto y contar con cupo disponible. |
| **Postcondiciones** | • La reserva del asistente se añade como un asistente más al evento y reduce en uno el cupo del recinto.<br>• El evento se añade a los próximos eventos del asistente.<br>• El sistema envía al correo de la cuenta el boleto digital confirmado, junto con su código QR. |
| **Errores** | • MSG-E-05 Evento sin lugares disponibles.<br>• MSG-E-06 Evento no encontrado o cancelado.<br>• MSG-E-20 Error: Ya tienes una reserva para este evento. |
| **Tipo** | Primario |

**Trayectorias del caso de uso:**


### Trayectoria Principal

1. Selecciona el botón “Reservar lugar” en la pantalla **UI05** Detalles del evento.
2. Verifica que el asistente se encuentre autenticado. [Trayectoria E]
3. Verifica que el evento esté activo y con cupo disponible.
4. Muestra la pantalla **UI06** Mapa de asientos y Disponibilidad del recinto con los lugares disponibles y ocupados. [Trayectoria B]
5. Selecciona el asiento deseado y presiona el botón “Confirmar Reserva”.
6. Valida que el asistente no tenga una reserva previa activa para el mismo evento. [Trayectoria C]
7. Genera la reserva y descuenta un lugar en el cupo del evento; genera el boleto digital con código QR conforme a CU-17. [Trayectoria A]
8. Muestra MSG-I-16 "Operación exitosa, su reserva se ha generado correctamente." y envía al correo registrado el boleto digital con código QR.
9. Muestra la pantalla **UI08** Consultar sus eventos (reservas del asistente).

*Fin de la trayectoria.*


### Trayectoria alternativa A:

> **Condición: Se activa si el evento se queda sin cupo disponible durante el proceso de reserva.**

- **A-1.** Intenta registrar la reserva, pero el cupo llegó a cero.
- **A-2.** Muestra el mensaje **MSG-E-05** Evento sin lugares disponibles.
- **A-3.** Muestra la pantalla **UI05** Detalles del evento mostrando el estado “Agotado.”

*Fin de la trayectoria.*


### Trayectoria alternativa B:

> **Condición: El evento al que se desea registrar no requiere selección de asiento.**

- **B-1.** Detecta que el evento no cuenta con mapa de asientos.
- **B-2.** Muestra una ventana de confirmación general con el texto ¿Deseas confirmar tu reserva? [Trayectoria D]
- **B-3.** Presiona “Confirmar”.
- **B-4.** Continúa en el paso 6 de la trayectoria principal.

*Fin de la trayectoria.*


### Trayectoria alternativa C:

> **Condición: El asistente ya cuenta con una reserva para el evento.**

- **C-1.** Valida el ID del asistente con la lista de inscritos al evento y detecta un registro previo.
- **C-2.** Muestra el mensaje **MSG-E-20** Error: Ya tienes una reserva para este evento.
- **C-3.** Muestra la pantalla **UI08** Consultar sus eventos (reservas del asistente).

*Fin de la trayectoria.*


### Trayectoria alternativa D:

> **Condición: El asistente presiona “Cancelar” en la ventana de confirmación general.**

- **D-1.** Cancela el proceso de reserva.
- **D-2.** Muestra el mensaje MSG-I-17 Proceso interrumpido con éxito, reserva cancelada.
- **D-3.** Muestra la pantalla **UI05** Detalles del evento.

*Fin de la trayectoria.*


### Trayectoria alternativa E: Usuario no autenticado

> **Condición:** En el paso 2 de la trayectoria principal, el visitante selecciona [Reservar lugar] sin mantener una sesión activa.

- **E-1.** El sistema identifica al actor como visitante anónimo.
- **E-2.** Muestra **MSG-I-24:** "Para reservar tu lugar en este evento es necesario iniciar sesión o crear una cuenta.".
- **E-3.** Redirige a **UI01** "Pantalla de Inicio de Sesión" o a **UI02** "Pantalla de Registro de Usuario" y conserva el ID del evento mediante el parámetro returnUrl.
- **E-4.** Tras autenticarse, recupera el evento seleccionado y lleva al actor a UI06 "Mapa de Asientos y Disponibilidad del Recinto" para continuar la reserva, verificando vigencia y disponibilidad.

*Fin de la trayectoria.*
