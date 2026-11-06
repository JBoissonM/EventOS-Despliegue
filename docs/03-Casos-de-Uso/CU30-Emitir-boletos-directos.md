---
caso_de_uso: "CU-30"
nombre: "Invitar asistentes a eventos privados (extend CU-24)"
actor: "Organizador."
proyecto: "EventOS"
version: "2.0"
tags:
  - caso-de-uso
  - ads
  - eventos
---

# CU-30: Invitar asistentes a eventos privados (extend CU-24)

> [!NOTE] Navegación
> - [Índice de Casos de Uso](./00-Indice-Casos-de-Uso.md)
> - [Requerimientos y Reglas de Negocio](../01-Requerimientos-y-Reglas-de-Negocio.md)
> - [Catálogos de Pantallas y Mensajes](../02-Actores-y-Catalogos.md)

**Resumen:** Permitir al Organizador invitar destinatarios con cuenta activa por correo electrónico a eventos privados bajo su administración, enviándoles un correo de notificación para que puedan visualizar el evento en la cartelera y realizar su reserva ordinaria de boleto.

**Descripción:**

| Atributo | Especificación |
| :--- | :--- |
| **Caso de uso** | **CU-30 Invitar asistentes a eventos privados (extend CU-24)** |
| **Autor** | Por definir. |
| **Actor** | Organizador. |
| **Propósito** | Permitir al Organizador registrar destinatarios por correo electrónico en eventos privados que administra, respetando aforo y unicidad de invitados, para habilitarles la visibilidad en cartelera y su reserva de acceso. |
| **Entradas** | • ID del evento aprobado administrado por el Organizador.<br>• Correo electrónico (institucional o externo) del destinatario con cuenta activa.<br>• Confirmación de envío de invitación. |
| **Salidas** | • Registro del invitado en el padrón del evento privado.<br>• Mensaje **MSG-I-08** "Operación realizada con éxito.".<br>• Correo electrónico de confirmación enviado al invitado con los detalles del evento y enlace directo.<br>• Evento privado visible en la cartelera del destinatario para reservar su boleto mediante CU-15. |
| **Precondiciones** | • El Organizador ha iniciado sesión y tiene permisos sobre el evento, desde CU-24 "Consultar mis eventos".<br>• El evento está aprobado, no ha concluido y tiene alcance Privado.<br>• El destinatario dispone de una cuenta activa en la plataforma (RN-05). |
| **Postcondiciones** | • Se registra la invitación activa en el padrón del evento.<br>• El total de invitados no supera el aforo autorizado del recinto (RN-07 y RN-29).<br>• No se genera una invitación duplicada para el mismo destinatario y evento (RN-08).<br>• Se envía un correo electrónico al invitado y el evento privado pasa a ser visible para él en la cartelera. |
| **Errores** | • **MSG-E-11** por falta de correo.<br>• **MSG-E-21** cuando el correo no sea válido.<br>• **MSG-E-49** cuando no exista una cuenta activa para el destinatario.<br>• **MSG-E-48** si el destinatario ya está invitado o cuenta con un boleto activo del evento.<br>• **MSG-E-03** o **MSG-E-05** cuando se alcance el límite de cupos del recinto.<br>• **MSG-E-07** si el evento no está habilitado o se encuentra inactivo.<br>• **MSG-E-08** por fallo al registrar la invitación en la base de datos. |
| **Tipo** | Secundario; extiende el CU-24 "Consultar mis eventos" (`<<extend>>`). |

**Trayectorias del caso de uso:**


### Trayectoria Principal

1. El Organizador selecciona un evento privado aprobado desde CU-24 "Consultar mis eventos" en **UI14** "Panel de Consulta de Mis Eventos" y abre la administración del evento (**UI15** / **UI16**).
2. El actor captura el correo electrónico del invitado en la sección de asistentes / invitados y presiona [Agregar invitado].
3. El sistema verifica que el evento tenga alcance Privado, siga vigente y esté bajo responsabilidad del Organizador. [Trayectoria D]
4. El sistema valida el formato del correo y comprueba la existencia de una cuenta activa para el destinatario. [Trayectoria A]
5. El sistema comprueba que el usuario no se encuentre ya invitado ni cuente con un boleto activo para ese evento, y que el total de invitados no supere el aforo nominal del recinto. [Trayectoria B] [Trayectoria C]
6. El sistema registra la asociación en el padrón de invitados y envía un correo electrónico de invitación al destinatario con los datos del evento privado y el enlace a la plataforma. [Trayectoria E]
7. Muestra **MSG-I-08** "Operación realizada con éxito." y habilita la visualización del evento en la cartelera (**UI04**) del destinatario para que pueda consultar sus detalles (**UI05**) y reservar su lugar (**CU-15**).
8. El Organizador puede repetir la operación para otros destinatarios mientras existan cupos disponibles.

*Fin de la trayectoria.*


### Trayectoria alternativa A: Datos o destinatario inválidos

> **Condición:** En el paso 4 faltan datos, el correo es inválido o no corresponde a una cuenta activa.

- **A-1.** Muestra **MSG-E-11** si falta el correo, **MSG-E-21** si el correo es incorrecto o **MSG-E-49** si la cuenta no existe o está inactiva.
- **A-2.** Mantiene los datos capturados para su corrección, sin registrar la invitación.

*Fin de la trayectoria.*


### Trayectoria alternativa B: Invitado duplicado o con boleto activo

> **Condición:** En el paso 5 el destinatario ya se encuentra registrado en el padrón de invitados o cuenta con un boleto activo para el evento.

- **B-1.** Muestra **MSG-E-48** "El destinatario ya cuenta con un boleto activo para este evento." (o ya está invitado).
- **B-2.** No genera un registro duplicado y permite ingresar otro correo.

*Fin de la trayectoria.*


### Trayectoria alternativa C: Evento sin cupo disponible

> **Condición:** En el paso 5 la invitación superaría el aforo autorizado del recinto.

- **C-1.** Muestra **MSG-E-03** "La cantidad solicitada excede el límite disponible." o **MSG-E-05** "Evento sin lugares disponibles.".
- **C-2.** Impide registrar al invitado, sin modificar los registros anteriores.

*Fin de la trayectoria.*


### Trayectoria alternativa D: Evento no habilitado

> **Condición:** En el paso 3 el evento no está aprobado, concluyó, fue cancelado o no es de alcance privado.

- **D-1.** El sistema impide la invitación y muestra **MSG-E-07** "Evento finalizado o inactivo." cuando el evento no está disponible.
- **D-2.** Regresa a la vista del evento sin registrar invitados.

*Fin de la trayectoria.*


### Trayectoria alternativa E: Error al registrar la invitación o enviar correo

> **Condición:** En el paso 6 no puede guardarse la invitación en la base de datos.

- **E-1.** Muestra **MSG-E-08** "Error de conexión con la base de datos.".
- **E-2.** No confirma la invitación hasta que el registro quede correctamente persistido.

*Fin de la trayectoria.*
