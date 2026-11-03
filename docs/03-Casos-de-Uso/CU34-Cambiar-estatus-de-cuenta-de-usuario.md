---
caso_de_uso: "CU-34"
nombre: "Cambiar estatus de cuenta de usuario"
actor: "Administrador"
proyecto: "EventOS"
version: "2.0"
tags:
  - caso-de-uso
  - ads
  - eventos
---

# CU-34: Cambiar estatus de cuenta de usuario

> [!NOTE] Navegación
> - [Índice de Casos de Uso](./00-Indice-Casos-de-Uso.md)
> - [Requerimientos y Reglas de Negocio](../01-Requerimientos-y-Reglas-de-Negocio.md)
> - [Catálogos de Pantallas y Mensajes](../02-Actores-y-Catalogos.md)

**Resumen:**

Permitir al Administrador activar o desactivar las cuentas de los usuarios registrados en la plataforma, controlando su acceso al sistema mediante la modificación del estado de sus cuentas. Los usuarios desactivados no podrán iniciar sesión hasta que el Administrador vuelva a habilitarlos.

**Descripción:**

| Atributo | Especificación |
| :--- | :--- |
| **Caso de uso** | **CU-34 Cambiar estatus de cuenta de usuario** |
| **Autor** | Moreno Ramirez Jose Jorge / Zempoalteca Salinas Enrique |
| **Actor** | Administrador |
| **Propósito** | Permitir al Administrador modificar el estado de las cuentas de los usuarios entre "Activo" e "Inactivo", con la finalidad de controlar el acceso a la plataforma sin eliminar permanentemente su información. |
| **Entradas** | • ID del Administrador autenticado, obtenido de la sesión activa.<br>• ID del usuario cuya cuenta será modificada.<br>• Estado actual de la cuenta seleccionada.<br>• Opción seleccionada para activar o desactivar la cuenta.<br>• Confirmación del cambio de estado. |
| **Salidas** | • Pantalla **UI20** "Gestión de Cuentas de Usuario".<br>• Listado de usuarios registrados con su información general y estado actual.<br>• Mensaje de confirmación **MSG-P-05** "¿Desea confirmar el cambio de estado de la cuenta seleccionada?".<br>• Mensaje informativo **MSG-I-08** "Operación realizada con éxito.", cuando se complete correctamente la actualización.<br>• Actualización del estado de la cuenta seleccionada. |
| **Precondiciones** | • El actor debe contar con una cuenta registrada y activa dentro de la plataforma.<br>• El actor debe haber iniciado sesión correctamente mediante el CU-01 "Iniciar Sesión".<br>• El actor debe tener asignado el rol de Administrador.<br>• La cuenta que se desea modificar debe encontrarse registrada en la base de datos. |
| **Postcondiciones** | • El estado de la cuenta seleccionada se actualiza correctamente en la base de datos.<br>• Si la cuenta cambia al estado "Inactivo", el usuario pierde la autorización para acceder al sistema hasta que su cuenta sea reactivada.<br>• Si la cuenta cambia al estado "Activo", el usuario podrá iniciar sesión nuevamente utilizando sus credenciales.<br>• La información personal del usuario permanece almacenada en la base de datos.<br>• Si el Administrador cancela la operación, el estado de la cuenta permanece sin modificaciones.<br>• La sesión del Administrador permanece activa. |
| **Errores** | Se mostrará el mensaje **MSG-E-08** "Error de conexión con la base de datos.", cuando el sistema no pueda consultar o actualizar la información de la cuenta.<br>Se mostrará el mensaje **MSG-E-43** "La cuenta seleccionada no existe o ya no se encuentra disponible.", cuando el usuario que se desea modificar no pueda localizarse en la base de datos. |
| **Tipo** | Primario para el actor Administrador. |

**Trayectorias del caso de uso:**


### Trayectoria Principal

1. Selecciona la opción "Gestión de cuentas de usuario" desde la pantalla **UI25** "Menú Principal de Administrador".
2. Consulta en la base de datos las cuentas de los usuarios registrados. [Trayectoria C]
3. Muestra la pantalla **UI20** "Gestión de Cuentas de Usuario", presentando el listado de usuarios con su información general y el estado actual de sus cuentas.
4. Selecciona la cuenta de un usuario que se encuentra con el estado "Activo".
5. Selecciona la opción [Desactivar] correspondiente a la cuenta seleccionada. [Trayectoria A]
6. Muestra el mensaje de confirmación **MSG-P-05** "¿Desea confirmar el cambio de estado de la cuenta seleccionada?", con las opciones [Aceptar] y [Cancelar]. [Trayectoria B]
7. Confirma la operación seleccionando el botón [Aceptar].
8. Verifica que la cuenta seleccionada continúe registrada y disponible para modificar su estado. [Trayectoria D]
9. Actualiza en la base de datos el estado de la cuenta seleccionada de "Activo" a "Inactivo" y revoca las sesiones activas de dicha cuenta. [Trayectoria C]
10. Muestra el mensaje **MSG-I-08** "Operación realizada con éxito." en la pantalla **UI20** "Gestión de Cuentas de Usuario".
11. Actualiza el listado de usuarios, mostrando el nuevo estado de la cuenta seleccionada.
12. Visualiza la confirmación del cambio de estado y finaliza la operación.

*Fin de la trayectoria.*


### Trayectoria alternativa A: Activar una cuenta de usuario

> **Condición:** Ocurre en el paso 5 de la trayectoria principal cuando el Administrador selecciona una cuenta que se encuentra con el estado "Inactivo" y desea habilitarla nuevamente.

- **A-1.** Selecciona una cuenta con el estado "Inactivo" desde la pantalla **UI20** "Gestión de Cuentas de Usuario".
- **A-2.** Selecciona la opción [Activar] correspondiente a la cuenta seleccionada.
- **A-3.** Muestra el mensaje **MSG-P-05** "¿Desea confirmar el cambio de estado de la cuenta seleccionada?", con las opciones [Aceptar] y [Cancelar]. [Trayectoria B]
- **A-4.** Confirma la activación seleccionando el botón [Aceptar].
- **A-5.** Verifica que la cuenta continúe registrada y actualiza su estado de "Inactivo" a "Activo" en la base de datos. [Trayectoria C] [Trayectoria D]
- **A-6.** Muestra el mensaje **MSG-I-08** "Operación realizada con éxito.".
- **A-7.** Actualiza el listado de la pantalla **UI20** "Gestión de Cuentas de Usuario", mostrando el nuevo estado de la cuenta.

*Fin de la trayectoria.*


### Trayectoria alternativa B: Cancelar el cambio de estado

> **Condición:** Ocurre en el paso 7 de la trayectoria principal o en el paso A-3 de la trayectoria alternativa A cuando el Administrador decide no confirmar el cambio de estado de la cuenta seleccionada.

- **B-1.** Selecciona el botón [Cancelar] en la ventana de confirmación.
- **B-2.** Interrumpe la operación sin modificar el estado de la cuenta seleccionada.
- **B-3.** Cierra la ventana de confirmación y mantiene al Administrador en la pantalla **UI20** "Gestión de Cuentas de Usuario".

*Fin de la trayectoria.*


### Trayectoria alternativa C: Error de conexión con la base de datos

> **Condición:** Ocurre en los pasos 2 o 9 de la trayectoria principal, o en el paso A-5 de la trayectoria alternativa A, cuando el sistema presenta una falla de conexión con la base de datos.

- **C-1.** Detecta una falla de conexión con la base de datos al intentar consultar o actualizar la información de la cuenta seleccionada.
- **C-2.** Muestra el mensaje **MSG-E-08** "Error de conexión con la base de datos.", notificando al Administrador que no fue posible completar o verificar la operación.
- **C-3.** Mantiene al Administrador en la pantalla **UI20** "Gestión de Cuentas de Usuario" cuando esta se encuentre disponible.
- **C-4.** Permite consultar nuevamente el estado de la cuenta una vez restablecida la conexión, antes de intentar otro cambio.

*Fin de la trayectoria.*


### Trayectoria alternativa D: Cuenta de usuario no encontrada

> **Condición:** Ocurre en el paso 8 de la trayectoria principal o en el paso A-5 de la trayectoria alternativa A cuando el sistema no encuentra la cuenta seleccionada en la base de datos.

- **D-1.** Detecta que la cuenta seleccionada ya no se encuentra registrada o disponible para realizar el cambio de estado.
- **D-2.** Impide continuar con la operación para evitar modificaciones sobre una cuenta inexistente.
- **D-3.** Muestra el mensaje **MSG-E-43** "La cuenta seleccionada no existe o ya no se encuentra disponible.".
- **D-4.** Actualiza el listado de usuarios en la pantalla **UI20** "Gestión de Cuentas de Usuario", permitiendo al Administrador seleccionar otra cuenta.

*Fin de la trayectoria.*
