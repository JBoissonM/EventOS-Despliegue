---
caso_de_uso: "CU-28"
nombre: "Solicitar requerimientos técnicos (extend CU-26)"
actor: "Organizador"
proyecto: "EventOS"
version: "2.0"
tags:
  - caso-de-uso
  - ads
  - eventos
---

# CU-28: Solicitar requerimientos técnicos (extend CU-26)

> [!NOTE] Navegación
> - [Índice de Casos de Uso](./00-Indice-Casos-de-Uso.md)
> - [Requerimientos y Reglas de Negocio](../01-Requerimientos-y-Reglas-de-Negocio.md)
> - [Catálogos de Pantallas y Mensajes](../02-Actores-y-Catalogos.md)

**Resumen:** Permitir al usuario solicitar el equipo de cómputo necesario para llevar a cabo su evento en el laboratorio.

**Descripción:**

| Atributo | Especificación |
| :--- | :--- |
| **Caso de uso** | **CU-28 Solicitar requerimientos técnicos (extend CU-26)** |
| **Autor** | Arciniega Valdez Yair Emmanuel |
| **Actor** | Organizador |
| **Propósito** | Registrar la cantidad de computadoras necesarias para el evento, garantizando que no se supere la capacidad instalada. |
| **Entradas** | Cantidad entera de computadoras a solicitar. |
| **Salidas** | El sistema muestra MSG-I-08 operación realizada con éxito.<br>El sistema muestra la UI15 Panel de Administración y Detalles del Evento. |
| **Precondiciones** | El usuario se encuentra en la pantalla UI07 "Formulario de Solicitud de Evento" o UI15 "Panel de Administración y Detalles del Evento".<br>El evento está configurado para realizarse en un espacio tipo laboratorio. |
| **Postcondiciones** | La cantidad de computadoras solicitadas se asocia al evento y se guarda permanentemente en la base de datos. |
| **Errores** | MSG-E-02 Cantidad inválida. Ingrese un número entero válido.<br>MSG-E-03 La cantidad solicitada excede el límite disponible. |
| **Tipo** | Secundario para el organizador, viene de **CU-26** Modificar detalles de un evento (`<<extend>>`). |


### Trayectoria Principal

1. Muestra el catálogo de requerimientos técnicos (equipos de cómputo disponibles).
2. Selecciona y/o ingresa la cantidad de computadoras necesarias para su actividad. [Trayectoria A]
3. Confirma la solicitud de requerimientos.
4. Valida que la cantidad ingresada sea un número entero y no exceda el límite máximo permitido. [Trayectoria B] [Trayectoria C]
5. Asocia los requerimientos técnicos al evento y actualiza la información en la base de datos.
6. Notifica que los requerimientos se guardaron correctamente y regresa el control al caso de uso base (“Modificar detalles de un evento”).

*Fin de la trayectoria.*


### Trayectoria alternativa A:

> **Condición:** El Organizador decide no agregar requerimientos y presiona "Cancelar" o "Regresar”.

- **A-1.** Descarta los datos introducidos que no hayan sido guardados.
- **A-2.** Regresa a UI15 Panel de Administración y Detalles del Evento.

*Fin de la trayectoria.*


### Trayectoria alternativa B:

> **Condición:** El Organizador ingresa datos inválidos en el apartado de cantidad de computadoras a usar.

- **B-1.** Muestra el MSG-E-02 Cantidad inválida. Ingrese un número entero válido.
- **B-2.** Resalta los campos con errores.
- **B-3.** Retoma el flujo en el paso 2 de la trayectoria principal.

*Fin de la trayectoria.*


### Trayectoria alternativa C:

> **Condición:** El Organizador ingresa un número mayor al límite permitido.

- **C-1.** Muestra el MSG-E-03 La cantidad solicitada excede el límite disponible.
- **C-2.** Bloquea la acción de guardado y resalta el campo de captura.
- **C-3.** Retoma el flujo en el paso 2 de la trayectoria principal.

*Fin de la trayectoria.*
