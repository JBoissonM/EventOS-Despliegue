---
caso_de_uso: "CU-17"
nombre: "Generar código QR (include CU-15)"
actor: "Asistente"
proyecto: "EventOS"
version: "2.0"
tags:
  - caso-de-uso
  - ads
  - eventos
---

# CU-17: Generar código QR (include CU-15)

> [!NOTE] Navegación
> - [Índice de Casos de Uso](./00-Indice-Casos-de-Uso.md)
> - [Requerimientos y Reglas de Negocio](../01-Requerimientos-y-Reglas-de-Negocio.md)
> - [Catálogos de Pantallas y Mensajes](../02-Actores-y-Catalogos.md)

**Resumen:**

Generar automáticamente el código QR asociado al boleto digital del Asistente durante la confirmación de su reserva de lugar.

**Descripción:**

| Atributo | Especificación |
| :--- | :--- |
| **Caso de uso** | **CU-17 Generar código QR (include CU-15)** |
| **Autor** | Ramos Mendoza Miguel Ángel |
| **Actor** | Asistente |
| **Propósito** | Generar un código QR único y asociarlo al boleto digital de la reserva confirmada. |
| **Entradas** | • Identificador de la reserva confirmada.<br>• Datos del Asistente asociados a la reserva.<br>• Datos del evento reservado. |
| **Salidas** | Código QR único asociado a la reserva.<br>Confirmación visual de que se generó el boleto. |
| **Precondiciones** | CU-15 “Reservar lugar a un evento” ha iniciado el proceso de confirmación y dispone de un identificador de reserva. |
| **Postcondiciones** | El código QR queda asociado a una reserva confirmada.<br>El boleto digital queda almacenado y disponible para el Asistente. |
| **Errores** | • **MSG-E-27**: “La reserva no ha sido confirmada”.<br>• **MSG-E-26**: “No fue posible generar el código QR. Intenta nuevamente”.<br>• **MSG-E-30**: “No fue posible guardar el boleto digital. Intenta nuevamente”. |
| **Tipo** | Secundario, incluye de **CU-15** (`<<include>>`). |


### Trayectoria Principal

1. Recibe el identificador de la reserva, los datos del Asistente y los datos del evento.
2. Verifica que el boleto corresponda al estado "Vigente". [Trayectoria A]
3. Genera un TokenQr único y encriptado que asocia el identificador del boleto. [Trayectoria B]
4. Construye el boleto digital fusionando la imagen del código QR (basada en el token) con los datos del Asistente y del evento.
5. Almacena la actualización del boleto, guardando el TokenQr generado y registrando el timestamp. [Trayectoria C]
6. Almacena el boleto digital y su información asociada. [Trayectoria C]
7. Notifica el éxito de la operación mostrando en pantalla el **MSG-I-16** “Operación exitosa, su reserva se ha generado correctamente”.
8. Muestra el boleto digital finalizado en la pantalla UI09 “Boleto Digital y Código QR” para que el Asistente pueda visualizarlo.

*Fin de la trayectoria.*


### Trayectoria alternativa A:

> **Condición:** El boleto no cuenta con el estado necesario para emitir el pase de entrada.

- **A-1.** Detecta que el boleto no cuenta con el estado necesario para emitir el pase de entrada.
- **A-2.** Muestra el **MSG-E-27** “La reserva no ha sido confirmada”.
- **A-3.** Detiene la generación del boleto digital y da por finalizado el caso de uso.

*Fin de la trayectoria.*


### Trayectoria alternativa B:

> **Condición:** Ocurre un error durante la generación del código QR.

- **B-1.** Detecta que no fue posible generar el código QR.
- **B-2.** Muestra **MSG-E-26** “No fue posible generar el código QR. Intenta nuevamente”.
- **B-3.** No habilita la consulta del boleto digital y devuelve el control a **CU-15**.

*Fin de la trayectoria.*


### Trayectoria alternativa C:

> **Condición:** No es posible almacenar el boleto digital.

- **C-1.** Detecta que el boleto digital no pudo almacenarse correctamente.
- **C-2.** Muestra **MSG-E-30** “No fue posible guardar el boleto digital. Intenta nuevamente”.
- **C-3.** No habilita la consulta del boleto digital y devuelve el control a CU-15.

*Fin de la trayectoria.*
