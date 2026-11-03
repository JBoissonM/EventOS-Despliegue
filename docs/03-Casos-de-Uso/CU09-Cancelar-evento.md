---
caso_de_uso: "CU-09"
nombre: "Cancelar evento (extend de CU-08)"
actor: "Subdirección de Servicios Educativos."
proyecto: "EventOS"
version: "2.0"
tags:
  - caso-de-uso
  - ads
  - eventos
---

# CU-09: Cancelar evento (extend de CU-08)

> [!NOTE] Navegación
> - [Índice de Casos de Uso](./00-Indice-Casos-de-Uso.md)
> - [Requerimientos y Reglas de Negocio](../01-Requerimientos-y-Reglas-de-Negocio.md)
> - [Catálogos de Pantallas y Mensajes](../02-Actores-y-Catalogos.md)

**Resumen:** Permitir al personal de Subdirección de Servicios Educativos cancelar un evento previamente aprobado, mediante un modal con motivo obligatorio y confirmación irreversible, garantizando la liberación del espacio, la invalidación de los boletos emitidos y la notificación en la plataforma y por correo al Organizador y a los asistentes registrados.

**Descripción:**

| Atributo | Especificación |
| :--- | :--- |
| **Caso de uso** | **CU-09 Cancelar evento (extend de CU-08)** |
| **Autor** | Benitez Alvarez Efrain. |
| **Actor** | Subdirección de Servicios Educativos. |
| **Propósito** | Permitir al personal de Subdirección de Servicios Educativos cancelar un evento aprobado de forma controlada mediante un modal, garantizando la actualización del estado, la liberación del recinto, la invalidación de los accesos y la notificación en plataforma y por correo al Organizador y a los asistentes. |
| **Entradas** | • ID del usuario autenticado, obtenido de la sesión activa.<br>• ID del evento seleccionado para su cancelación.<br>• Motivo de cancelación (obligatorio).<br>• Confirmación explícita de la cancelación del evento. |
| **Salidas** | • Mensaje de confirmación **MSG-P-01** "¿Desea confirmar la cancelación del evento seleccionado?".<br>• Mensaje informativo **MSG-I-02** "El evento se ha cancelado exitosamente.".<br>• Actualización del estado del evento a "Cancelado".<br>• Liberación de la disponibilidad del espacio físico previamente reservado.<br>• Invalidación de los boletos digitales y códigos QR asociados al evento.<br>• Notificación inmediata en la plataforma y correo electrónico al Organizador del evento y a los asistentes registrados, indicando el motivo de cancelación.<br>• Registro de la cancelación en la bitácora histórica del sistema. |
| **Precondiciones** | • El actor debe contar con una cuenta registrada y activa dentro de la plataforma.<br>• El actor debe haber iniciado sesión correctamente mediante el CU-01 "Iniciar Sesión".<br>• El actor debe tener asignado el rol de Subdirección de Servicios Educativos.<br>• El evento debe encontrarse registrado en el sistema con el estatus "Aprobado".<br>• El evento debe contar con una reserva de espacio físico previamente autorizada.<br>• El actor debe haber presionado el botón [Cancelar] en la fila del evento deseado dentro de la tabla de **UI13**. |
| **Postcondiciones** | • El estado del evento cambia de "Aprobado" a "Cancelado" cuando la operación se completa correctamente.<br>• El espacio físico asignado al evento queda disponible para nuevas solicitudes durante la fecha y horario anteriormente reservados.<br>• Los boletos digitales y códigos QR emitidos para el evento quedan invalidados.<br>• El sistema genera una notificación inmediata en la plataforma y envía un correo electrónico al Organizador y a los asistentes registrados, informando el motivo de la cancelación.<br>• La cancelación queda registrada en la bitácora histórica del sistema.<br>• El evento cancelado deja de aparecer en el listado de eventos aprobados.<br>• Si el actor cancela la operación antes de confirmarla, el evento conserva su estado original y no se modifica su información.<br>• La sesión del actor permanece activa. |
| **Errores** | • Se mostrará el mensaje **MSG-E-11** "Por favor, completa todos los campos obligatorios resaltados para continuar.", cuando el actor no ingrese el motivo de cancelación.<br>• Se mostrará el mensaje **MSG-E-08** "Error de conexión con la base de datos.", cuando el sistema no pueda recuperar o actualizar la información necesaria para cancelar el evento.<br>• Se mostrará el mensaje **MSG-E-06** "Evento no encontrado o cancelado.", cuando el evento seleccionado ya no exista o haya sido cancelado previamente.<br>• Se mostrará el mensaje **MSG-E-01** "El evento ya ha concluido.", cuando se intente cancelar un evento que ya terminó. |
| **Tipo** | Secundario para el actor Subdirección de Servicios Educativos. Extiende el CU-08 "Consultar eventos aprobados", conforme a la relación `<<extend>>` establecida en el diagrama de casos de uso. |


### Trayectoria Principal

1. Se detona la extensión desde el paso 5c de CU-08 al presionar el botón [Cancelar] en la tabla de **UI13**.
2. consulta en la base de datos la vigencia del evento y valida que conserve el estatus "Aprobado" y que no haya concluido. [Trayectoria C: Error BD] [Trayectoria D: Ya concluido]
3. despliega el Modal de Cancelación Ejecutiva sobre la pantalla **UI13**, advirtiendo que la acción es irreversible y presentando un campo de texto obligatorio (TextArea) para capturar la justificación.
4. redacta el motivo de la cancelación y presiona el botón [Continuar].
5. valida que el campo de motivo no esté vacío ni contenga solo espacios en blanco. [Trayectoria A: Motivo vacío]
6. muestra la alerta de confirmación con el mensaje **MSG-P-01** "¿Desea confirmar la cancelación del evento seleccionado?", presentando los botones [Confirmar Cancelación] y [Regresar]. [Trayectoria B: Cancelar operación]
7. confirma la operación seleccionando [Confirmar Cancelación].
8. ejecuta la transacción de forma atómica:
   a) Cambia el estatus del evento a "Cancelado".
   b) Libera el espacio físico en la agenda escolar para nuevas solicitudes.
   c) Invalida todos los códigos QR y pases de entrada emitidos.
   d) Despacha la notificación y correo electrónico con el motivo tanto al Organizador como a los Asistentes.
   e) Registra la acción con fecha, hora y responsable en la bitácora histórica del sistema.
9. cierra el modal, muestra la notificación emergente **MSG-I-02** "El evento se ha cancelado exitosamente." y actualiza reactivamente la tabla de **UI13** retirando la fila del evento cancelado.
10. visualiza la tabla actualizada y continúa operando en **UI13**.

*Fin de la trayectoria.*


### Trayectoria alternativa A: Motivo de cancelación no proporcionado

> **Condición: Ocurre en el paso 5 de la trayectoria principal cuando el actor intenta continuar sin ingresar un motivo válido de cancelación.**

- **A-1.** Detecta que el campo correspondiente al motivo de cancelación se encuentra vacío o contiene únicamente espacios en blanco.
- **A-2.** Detiene el proceso de cancelación y muestra el mensaje **MSG-E-11** "Por favor, completa todos los campos obligatorios resaltados para continuar.".
- **A-3.** Mantiene abierto el Modal de Cancelación en **UI13**, resaltando el borde del TextArea en rojo y desplegando el mensaje **MSG-E-11**.
- **A-4.** Ingresa el motivo correspondiente y selecciona nuevamente la opción [Continuar].
- **A-5.** Retoma la ejecución desde el paso 5 de la trayectoria principal para validar la información ingresada.

*Fin de la trayectoria.*


### Trayectoria alternativa B: Cancelar la operación de cancelación del evento

> **Condición: Ocurre en el paso 6 de la trayectoria principal cuando el actor selecciona [Regresar] y decide no confirmar la cancelación del evento.**

- **B-1.** selecciona el botón [Regresar] o cierra la alerta de confirmación mostrada mediante **MSG-P-01**.
- **B-2.** Interrumpe la operación de cancelación sin realizar modificaciones a la información del evento.
- **B-3.** Mantiene el evento con el estatus "Aprobado", conservando la reserva del espacio físico y la validez de los boletos emitidos.
- **B-4.** regresa al Modal de Cancelación sobre **UI13**, permitiendo modificar el motivo ingresado o cerrar el modal sin cancelar el evento.

*Fin de la trayectoria.*


### Trayectoria alternativa C: Error de conexión con la base de datos

> **Condición: Ocurre en los pasos 2 u 8 de la trayectoria principal cuando una falla en la base de datos impide consultar o actualizar correctamente el evento.**

- **C-1.** Detecta una falla de conexión con la base de datos al intentar consultar o actualizar la información necesaria para cancelar el evento.
- **C-2.** Muestra el mensaje **MSG-E-08** "Error de conexión con la base de datos.", notificando al actor que no fue posible completar o verificar la operación.
- **C-3.** Si la operación de cancelación aún no ha sido confirmada y registrada, mantiene el evento sin modificaciones. Si la falla ocurre durante la actualización, verifica el resultado de la transacción antes de permitir un nuevo intento, evitando cancelaciones duplicadas o inconsistencias.
- **C-4.** Mantiene al actor en la pantalla **UI13** "Panel de Eventos", permitiéndole volver a consultar el estado del evento cuando se restablezca la conexión.

*Fin de la trayectoria.*


### Trayectoria alternativa D: Evento no disponible para cancelación

> **Condición: Ocurre en el paso 2 de la trayectoria principal cuando el sistema detecta que el evento seleccionado ya fue cancelado, no existe o ha concluido.**

- **D-1.** Identifica que el evento seleccionado no cumple con las condiciones necesarias para realizar su cancelación.
- **D-2.** Impide continuar con la operación para evitar modificaciones sobre un evento que ya no puede ser cancelado.
- **D-3.** Muestra el mensaje **MSG-E-06** "Evento no encontrado o cancelado.", cuando el evento no exista o haya sido cancelado previamente, o el mensaje **MSG-E-01** "El evento ya ha concluido.", cuando el evento haya finalizado.
- **D-4.** Actualiza el listado de eventos aprobados y mantiene al actor en la pantalla **UI13** "Panel de Eventos".

*Fin de la trayectoria.*
