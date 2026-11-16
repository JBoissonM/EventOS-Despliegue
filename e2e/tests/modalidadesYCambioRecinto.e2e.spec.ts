import assert from "node:assert/strict";
import { By, WebDriver, until } from "selenium-webdriver";
import { LoginPage } from "../pages/LoginPage";
import {
  API_URL,
  BASE_URL,
  connectTestDb,
  createChromeDriver,
} from "../utils/testEnv";

async function clearSession(driver: WebDriver): Promise<void> {
  try {
    await driver.executeScript("window.localStorage.clear(); window.sessionStorage.clear();");
  } catch {
    // Ignore when page has no origin yet
  }
}

async function createVerifiedUser(
  db: any,
  email: string,
  nombre: string,
  apellidoPa: string,
  tipoCuenta = "Usuario Interno",
  withToken = false,
): Promise<{ idUsuario: number; token: string }> {
  const bcrypt = await import("../../apps/backend/node_modules/bcrypt");
  const hash = await bcrypt.default.hash("Password123!", 10);

  const userRes = await db.query(
    `INSERT INTO usuario (
       nombre,
       "apellidoPa",
       "apellidoMa",
       correo,
       contrasena,
       estatus,
       "esVerificado",
       "tipoCuenta",
       "esJefeAcademia"
     ) VALUES ($1, $2, 'E2E', $3, $4, true, 'Verificado', $5, false)
     RETURNING "idUsuario"`,
    [nombre, apellidoPa, email, hash, tipoCuenta],
  );
  const idUsuario = Number(userRes.rows[0].idUsuario);

  let token = "";
  if (withToken) {
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        correo: email,
        contrasena: "Password123!",
        captchaToken: "e2e-bypass",
      }),
    });
    if (!loginRes.ok) {
      const errBody = await loginRes.text();
      throw new Error(`Login falló para ${email} (${loginRes.status}): ${errBody}`);
    }
    const loginData: any = await loginRes.json();
    token = loginData.token ?? loginData.access_token;
    assert.ok(token, `Token JWT faltante para ${email}`);
  }

  return { idUsuario, token };
}

async function findFreeDate(db: any, idRecinto: number, startOffsetDays = 10): Promise<string> {
  const currentYear = new Date().getFullYear();
  const endCap = `${currentYear}-12-18`;

  for (let offset = startOffsetDays; offset <= 60; offset++) {
    const candidate = new Date(Date.now() + offset * 86_400_000)
      .toISOString()
      .slice(0, 10);
    if (candidate > endCap) break;

    const existing = await db.query(
      `SELECT 1
       FROM "subEvento" se
       INNER JOIN fecha f ON se."idFecha" = f."idFecha"
       INNER JOIN evento e ON se."idEvento" = e."idEvento"
       WHERE se."idRecinto" = $1
         AND f.fecha = $2
         AND se.estado != 'Cancelado'
         AND e."idEstadoEvento" IN (2, 3)
       LIMIT 1`,
      [idRecinto, candidate],
    );
    if (existing.rows.length === 0) {
      return candidate;
    }
  }

  return `${currentYear}-12-17`;
}

async function runModalidadesYCambioRecintoSuite(): Promise<void> {
  const driver: WebDriver = await createChromeDriver();
  const loginPage = new LoginPage(driver);
  const db = await connectTestDb();

  const ts = Date.now().toString().slice(-6);
  const createdEventIds: number[] = [];
  const createdUserIds: number[] = [];
  const createdFechaIds: number[] = [];
  let tempLabId: number | null = null;

  try {
    console.log("=== INICIANDO SUITE E2E: MODALIDADES, CAMBIO DE RECINTO Y FIFO ===");

    const organizer = await createVerifiedUser(
      db,
      `org.mod.${ts}@ipn.mx`,
      "Andrea",
      "Organizadora",
      "Usuario Interno",
      true,
    );
    createdUserIds.push(organizer.idUsuario);

    const logistics = await createVerifiedUser(
      db,
      `log.mod.${ts}@alumno.ipn.mx`,
      "Marco",
      "Logistica",
      "Asistente",
    );
    createdUserIds.push(logistics.idUsuario);

    const att1 = await createVerifiedUser(
      db,
      `fifo1.${ts}@alumno.ipn.mx`,
      "Primero",
      "Fifo",
      "Asistente",
    );
    createdUserIds.push(att1.idUsuario);

    const att2 = await createVerifiedUser(
      db,
      `fifo2.${ts}@alumno.ipn.mx`,
      "Segundo",
      "Fifo",
      "Asistente",
    );
    createdUserIds.push(att2.idUsuario);

    const att3 = await createVerifiedUser(
      db,
      `fifo3.${ts}@alumno.ipn.mx`,
      "Tercero",
      "Fifo",
      "Asistente",
    );
    createdUserIds.push(att3.idUsuario);

    let logisticsToken = "";
    let subToken = "";

    // Crear laboratorio temporal con exactamente 2 equipos para validar corte FIFO
    const labRes = await db.query(
      `INSERT INTO recinto (nombre, aforo, "idEstadoRecinto")
       VALUES ($1, 2, 1)
       RETURNING "idRecinto"`,
      [`Lab E2E FIFO ${ts}`],
    );
    tempLabId = Number(labRes.rows[0].idRecinto);
    await db.query(
      `INSERT INTO "estadoEquipo" ("numeroEquipo", estado, "idRecinto")
       VALUES (1, true, $1), (2, true, $1)`,
      [tempLabId],
    );

    const dateSala = await findFreeDate(db, 4, 10);
    const dateAuditorio = await findFreeDate(db, 1, 14);
    const dateLab = await findFreeDate(db, tempLabId!, 18);

    // -------------------------------------------------------------------------
    // CASO 1: Reglas por recinto en API (/solicitudes)
    // -------------------------------------------------------------------------
    console.log("  [Caso 1] Validando reglas oficiales por recinto en POST /api/solicitudes...");
    const invalidSala14Res = await fetch(`${API_URL}/solicitudes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${organizer.token}`,
      },
      body: JSON.stringify({
        nombre: `Invalido Sala 14 ${ts}`,
        descripcion: "Intento de usar mapa de asientos en Sala 14.",
        justificacion: "Prueba de regla por recinto.",
        idAlcance: 1,
        poster: "https://placehold.co/2048x1152/png",
        subeventos: [
          {
            nombre: "Sub Sala 14 Inválido",
            descripcion: "Desc",
            fecha: dateSala,
            horaInicio: "09:00",
            horaFin: "10:00",
            idRecinto: 4,
            idModalidadAcceso: 4,
          },
        ],
      }),
    });
    assert.equal(
      invalidSala14Res.status,
      400,
      `Sala 14 con QR_MAPA debe responder 400 (recibido ${invalidSala14Res.status})`,
    );

    const invalidLabRes = await fetch(`${API_URL}/solicitudes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${organizer.token}`,
      },
      body: JSON.stringify({
        nombre: `Invalido Lab ${ts}`,
        descripcion: "Intento de registro simple en laboratorio.",
        justificacion: "Prueba de regla de hardware en laboratorio.",
        idAlcance: 1,
        poster: "https://placehold.co/2048x1152/png",
        subeventos: [
          {
            nombre: "Sub Lab Inválido",
            descripcion: "Desc",
            fecha: dateLab,
            horaInicio: "09:00",
            horaFin: "10:00",
            idRecinto: tempLabId,
            idModalidadAcceso: 2,
          },
        ],
      }),
    });
    assert.equal(
      invalidLabRes.status,
      400,
      `Laboratorio con modalidad != QR_GENERAL debe responder 400 (recibido ${invalidLabRes.status})`,
    );
    console.log("  ✓ Caso 1 passed");

    // -------------------------------------------------------------------------
    // CASO 2: REGISTRO_SIMPLE -> bloqueo de escáner + UI Logística + Organizador
    // -------------------------------------------------------------------------
    console.log("  [Caso 2] Validando Registro simple sin QR en Logística y Organizador...");
    const evSimpleNombre = `Evento Simple E2E ${ts}`;
    const evSimpleRes = await db.query(
      `INSERT INTO evento (nombre, descripcion, poster, justificacion, "esUrgente", "idAlcance", "idEstadoEvento", "idOrganizador")
       VALUES ($1, $2, $3, $4, false, 1, 2, $5)
       RETURNING "idEvento"`,
      [
        evSimpleNombre,
        "Evento con inscripción simple sin QR.",
        "https://placehold.co/2048x1152/png",
        "Prueba de logística y métricas del organizador.",
        organizer.idUsuario,
      ],
    );
    const evSimpleId = Number(evSimpleRes.rows[0].idEvento);
    createdEventIds.push(evSimpleId);

    const fSimpleRes = await db.query(
      `INSERT INTO fecha (fecha, "horaInicio", "horaFin") VALUES ($1, '11:00:00', '12:00:00') RETURNING "idFecha"`,
      [dateSala],
    );
    const fSimpleId = Number(fSimpleRes.rows[0].idFecha);
    createdFechaIds.push(fSimpleId);

    const subSimpleRes = await db.query(
      `INSERT INTO "subEvento" ("idModalidadAcceso", estado, nombre, descripcion, "idEvento", "idRecinto", "idFecha")
       VALUES (2, 'Aceptado', $1, 'Sesión nominal sin QR', $2, 4, $3)
       RETURNING "idSubEvento"`,
      [`Sesión Simple ${ts}`, evSimpleId, fSimpleId],
    );
    const subSimpleId = Number(subSimpleRes.rows[0].idSubEvento);

    await db.query(
      `INSERT INTO "eventoPersonalLogistica" ("idEvento", "idUsuario") VALUES ($1, $2)`,
      [evSimpleId, logistics.idUsuario],
    );

    const bSimpleRes = await db.query(
      `INSERT INTO boleto ("tokenQR", "idAsiento", "idEstadoBoleto") VALUES ('', NULL, 1) RETURNING "idBoleto"`,
    );
    const bSimpleId = Number(bSimpleRes.rows[0].idBoleto);
    await db.query(
      `INSERT INTO "asistenteEvento" ("idUsuario", "idSubEvento", "idBoleto") VALUES ($1, $2, $3)`,
      [att1.idUsuario, subSimpleId, bSimpleId],
    );

    // UI Logística: ControlAcceso sin botón Abrir Escáner y EscanearBoleto deshabilitado
    await loginPage.open();
    await clearSession(driver);
    await loginPage.login(`log.mod.${ts}@alumno.ipn.mx`, "Password123!");
    await driver.wait(until.urlContains("/menu-asistente"), 10000);
    logisticsToken = (await driver.executeScript(() => localStorage.getItem("token"))) || "";
    assert.ok(logisticsToken, "Debe obtener token de logística tras login UI");

    // Bloqueo de escáner por API
    const scanBlockedRes = await fetch(
      `${API_URL}/logistica/subeventos/${subSimpleId}/escanear`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${logisticsToken}`,
        },
        body: JSON.stringify({ idBoleto: bSimpleId }),
      },
    );
    assert.equal(
      scanBlockedRes.status,
      400,
      `Escanear boleto de REGISTRO_SIMPLE debe responder 400 (recibido ${scanBlockedRes.status})`,
    );

    await driver.get(`${BASE_URL}/control-acceso/${subSimpleId}`);
    const simpleControlText = await driver.wait(
      until.elementLocated(
        By.xpath("//*[contains(normalize-space(), 'Escáner QR deshabilitado')]"),
      ),
      8000,
    );
    assert.equal(await simpleControlText.isDisplayed(), true);
    const scannerBtns = await driver.findElements(
      By.xpath("//button[contains(normalize-space(), 'Abrir Escáner')]"),
    );
    assert.equal(scannerBtns.length, 0, "No debe mostrarse el botón Abrir Escáner en REGISTRO_SIMPLE");
    const enrolledListRow = await driver.wait(
      until.elementLocated(
        By.xpath(`//td[contains(normalize-space(), 'fifo1.${ts}@alumno.ipn.mx')]`),
      ),
      5000,
    );
    assert.equal(await enrolledListRow.isDisplayed(), true);

    await driver.get(`${BASE_URL}/escanear-boleto/${subSimpleId}`);
    const blockedScannerHeading = await driver.wait(
      until.elementLocated(By.xpath("//h2[normalize-space()='Escáner deshabilitado']")),
      8000,
    );
    assert.equal(await blockedScannerHeading.isDisplayed(), true);

    // UI Organizador: Inscritos = 1, Ingresados = "No aplica (sin QR)"
    await loginPage.open();
    await clearSession(driver);
    await loginPage.login(`org.mod.${ts}@ipn.mx`, "Password123!");
    await driver.wait(until.urlContains("/menu-asistente"), 10000);

    await driver.get(`${BASE_URL}/organizador/administrar-evento/${evSimpleId}`);
    const noQrIngresados = await driver.wait(
      until.elementLocated(By.xpath("//*[normalize-space()='No aplica (sin QR)']")),
      8000,
    );
    assert.equal(await noQrIngresados.isDisplayed(), true);
    console.log("  ✓ Caso 2 passed");

    // -------------------------------------------------------------------------
    // CASO 3: Modificación sin bloqueo + Comparador UI + Corte FIFO (3 -> 2)
    // -------------------------------------------------------------------------
    console.log("  [Caso 3] Probando modificación no bloqueante + Comparador UI + Corte FIFO (3 inscritos -> Lab aforo 2)...");
    const evFifoNombre = `Evento FIFO E2E ${ts}`;
    const evFifoRes = await db.query(
      `INSERT INTO evento (nombre, descripcion, poster, justificacion, "esUrgente", "idAlcance", "idEstadoEvento", "idOrganizador")
       VALUES ($1, $2, $3, $4, false, 1, 2, $5)
       RETURNING "idEvento"`,
      [
        evFifoNombre,
        "Evento en Auditorio con 3 inscritos que migra a laboratorio de 2 equipos.",
        "https://placehold.co/2048x1152/png",
        "Prueba E2E de flujo FIFO y matriz de transición.",
        organizer.idUsuario,
      ],
    );
    const evFifoId = Number(evFifoRes.rows[0].idEvento);
    createdEventIds.push(evFifoId);

    const fFifoRes = await db.query(
      `INSERT INTO fecha (fecha, "horaInicio", "horaFin") VALUES ($1, '14:00:00', '16:00:00') RETURNING "idFecha"`,
      [dateAuditorio],
    );
    const fFifoId = Number(fFifoRes.rows[0].idFecha);
    createdFechaIds.push(fFifoId);

    const subFifoRes = await db.query(
      `INSERT INTO "subEvento" ("idModalidadAcceso", estado, nombre, descripcion, "idEvento", "idRecinto", "idFecha")
       VALUES (4, 'Aceptado', $1, 'Ponencia con asientos en Auditorio', $2, 1, $3)
       RETURNING "idSubEvento"`,
      [`Ponencia FIFO ${ts}`, evFifoId, fFifoId],
    );
    const subFifoId = Number(subFifoRes.rows[0].idSubEvento);

    const seatsRes = await db.query(
      `SELECT "idAsiento" FROM asiento WHERE "idRecinto" = 1 ORDER BY "idAsiento" ASC LIMIT 3`,
    );
    assert.equal(seatsRes.rows.length, 3);

    const fifoTickets: number[] = [];
    const fifoUsers = [att1.idUsuario, att2.idUsuario, att3.idUsuario];
    const hoursAgo = ["3 hours", "2 hours", "1 hour"];

    for (let i = 0; i < 3; i++) {
      const bRes = await db.query(
        `INSERT INTO boleto ("tokenQR", "fechaGeneracion", "idAsiento", "idEstadoBoleto")
         VALUES ($1, NOW() - $2::interval, $3, 1)
         RETURNING "idBoleto"`,
        [`QR-FIFO-${ts}-${i + 1}`, hoursAgo[i], Number(seatsRes.rows[i].idAsiento)],
      );
      const idBol = Number(bRes.rows[0].idBoleto);
      fifoTickets.push(idBol);
      await db.query(
        `INSERT INTO "asistenteEvento" ("idUsuario", "idSubEvento", "idBoleto") VALUES ($1, $2, $3)`,
        [fifoUsers[i], subFifoId, idBol],
      );
    }

    // Solicitud de modificación hacia el laboratorio temporal (aforo = 2 < 3 inscritos)
    const modRes = await fetch(`${API_URL}/eventos/${evFifoId}/logistica`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${organizer.token}`,
      },
      body: JSON.stringify({
        motivoModificacion: "Reubicación a laboratorio de menor aforo para prueba FIFO.",
        subeventos: [
          {
            idSubEvento: subFifoId,
            nombre: `Ponencia FIFO ${ts}`,
            descripcion: "Reubicada a laboratorio temporal",
            idRecinto: tempLabId,
            idModalidadAcceso: 3,
            fecha: dateLab,
            horaInicio: "14:00",
            horaFin: "16:00",
          },
        ],
      }),
    });
    assert.equal(
      modRes.status,
      200,
      `Reducción de aforo no debe bloquear la solicitud (recibido ${modRes.status})`,
    );
    const modData: any = await modRes.json();
    assert.equal(modData.advertenciasImpacto?.[0]?.canceladosSobrecupoFifo, 1);
    assert.equal(modData.advertenciasImpacto?.[0]?.conservadosFifo, 2);

    // Subdirección revisa comparador UI y aprueba
    await loginPage.open();
    await clearSession(driver);
    await loginPage.login("subdireccion@ipn.mx", "Admin123!");
    await driver.wait(until.urlContains("/subdireccion/menu-principal"), 10000);
    subToken = (await driver.executeScript(() => localStorage.getItem("token"))) || "";
    assert.ok(subToken, "Debe obtener token de Subdirección tras login UI");

    await driver.get(`${BASE_URL}/detalles-solicitud/${evFifoId}`);
    const beforeVenueEl = await driver.wait(
      until.elementLocated(
        By.xpath("//*[contains(normalize-space(), 'Antes: Auditorio Principal')]"),
      ),
      8000,
    );
    assert.equal(await beforeVenueEl.isDisplayed(), true);

    const fifoImpactNotice = await driver.wait(
      until.elementLocated(
        By.xpath("//*[contains(normalize-space(), 'cancelados por sobrecupo')]"),
      ),
      5000,
    );
    assert.equal(await fifoImpactNotice.isDisplayed(), true);

    const btnAprobar = await driver.findElement(By.id("botonAprobar"));
    await driver.executeScript("arguments[0].scrollIntoView({ block: 'center' });", btnAprobar);
    await btnAprobar.click();

    const btnAceptarAprobar = await driver.wait(
      until.elementLocated(By.xpath("//dialog[@open]//button[normalize-space()='Aceptar']")),
      5000,
    );
    await btnAceptarAprobar.click();

    const btnExitoAceptar = await driver.wait(
      until.elementLocated(
        By.xpath("//dialog[@open and .//h2[normalize-space()='Operación exitosa']]//button[normalize-space()='Aceptar']"),
      ),
      8000,
    );
    await btnExitoAceptar.click();
    await driver.wait(until.urlContains("/subdireccion/lista-solicitudes"), 8000);

    // Verificar BD: primeros 2 boletos (B1, B2) válidos sin asiento; B3 cancelado por sobrecupo
    const postFifoRes = await db.query(
      `SELECT "idBoleto", "idEstadoBoleto", "idAsiento"
       FROM boleto
       WHERE "idBoleto" = ANY($1::int[])`,
      [fifoTickets],
    );
    const byId = new Map<number, any>(
      postFifoRes.rows.map((r: any) => [Number(r.idBoleto), r]),
    );

    assert.equal(Number(byId.get(fifoTickets[0]).idEstadoBoleto), 1, "Boleto #1 (más antiguo) debe seguir VÁLIDO");
    assert.equal(byId.get(fifoTickets[0]).idAsiento, null, "Boleto #1 debe perder idAsiento al pasar a QR_GENERAL");
    assert.equal(Number(byId.get(fifoTickets[1]).idEstadoBoleto), 1, "Boleto #2 (segundo más antiguo) debe seguir VÁLIDO");
    assert.equal(byId.get(fifoTickets[1]).idAsiento, null, "Boleto #2 debe perder idAsiento al pasar a QR_GENERAL");
    assert.equal(Number(byId.get(fifoTickets[2]).idEstadoBoleto), 3, "Boleto #3 (más reciente) debe cancelarse por sobrecupo FIFO");
    console.log("  ✓ Caso 3 passed");

    // -------------------------------------------------------------------------
    // CASO 4: Matriz de transición CANCELADO_REAUTH (2 -> 3) y CANCELADO_LIBERADO (3 -> 1)
    // -------------------------------------------------------------------------
    console.log("  [Caso 4] Validando transiciones REGISTRO_SIMPLE -> QR_GENERAL (B) y QR_GENERAL -> ACCESO_LIBRE (C)...");
    const reauthReq = await fetch(`${API_URL}/eventos/${evSimpleId}/logistica`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${organizer.token}`,
      },
      body: JSON.stringify({
        motivoModificacion: "Escalamiento a boleto con QR para control de puerta.",
        subeventos: [
          {
            idSubEvento: subSimpleId,
            nombre: `Sesión Simple ${ts}`,
            descripcion: "Actualizado a QR Admisión general",
            idRecinto: 4,
            idModalidadAcceso: 3,
            fecha: dateSala,
            horaInicio: "11:00",
            horaFin: "12:00",
          },
        ],
      }),
    });
    assert.equal(reauthReq.status, 200);

    const approveReauth = await fetch(`${API_URL}/solicitudes/${evSimpleId}/aprobar`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${subToken}` },
    });
    assert.equal(approveReauth.status, 200);

    const bAfterReauth = await db.query(
      `SELECT "idEstadoBoleto" FROM boleto WHERE "idBoleto" = $1`,
      [bSimpleId],
    );
    assert.equal(
      Number(bAfterReauth.rows[0].idEstadoBoleto),
      3,
      "Registro simple debe cancelarse al pasar a QR_GENERAL (CANCELADO_REAUTH / Correo B)",
    );

    // Ahora probar CANCELADO_LIBERADO: cambiar ponencia FIFO (actualmente QR_GENERAL con B1 y B2 activos) a Sala 14 ACCESO_LIBRE
    const liberaDirecto = await fetch(`${API_URL}/eventos/${evFifoId}/logistica`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${subToken}`,
      },
      body: JSON.stringify({
        subeventos: [
          {
            idSubEvento: subFifoId,
            nombre: `Ponencia FIFO ${ts}`,
            descripcion: "Liberada a acceso libre en Sala 14",
            idRecinto: 4,
            idModalidadAcceso: 1,
            fecha: dateSala,
            horaInicio: "15:00",
            horaFin: "17:00",
          },
        ],
      }),
    });
    assert.equal(liberaDirecto.status, 200);

    const bAfterFree = await db.query(
      `SELECT "idEstadoBoleto" FROM boleto WHERE "idBoleto" = ANY($1::int[])`,
      [[fifoTickets[0], fifoTickets[1]]],
    );
    for (const row of bAfterFree.rows) {
      assert.equal(
        Number(row.idEstadoBoleto),
        3,
        "Boletos previos deben quedar cancelados al liberar a Acceso libre (Correo C)",
      );
    }
    console.log("  ✓ Caso 4 passed");

    console.log("\n=================================================================");
    console.log(">>> SUITE E2E MODALIDADES, CAMBIO DE RECINTO Y FIFO SUPERADA (4/4) <<<");
    console.log("=================================================================\n");
  } finally {
    try {
      if (createdEventIds.length > 0) {
        const subRows = await db.query(
          `SELECT "idSubEvento", "idFecha" FROM "subEvento" WHERE "idEvento" = ANY($1::int[])`,
          [createdEventIds],
        );
        const subIds = subRows.rows.map((r: any) => Number(r.idSubEvento));
        const fechaIds = [
          ...new Set([
            ...createdFechaIds,
            ...subRows.rows.map((r: any) => Number(r.idFecha)).filter(Boolean),
          ]),
        ];

        if (subIds.length > 0) {
          const bolRows = await db.query(
            `SELECT "idBoleto" FROM "asistenteEvento" WHERE "idSubEvento" = ANY($1::int[]) AND "idBoleto" IS NOT NULL`,
            [subIds],
          );
          const bolIds = bolRows.rows.map((r: any) => Number(r.idBoleto));
          await db.query(
            `DELETE FROM "asistenteEvento" WHERE "idSubEvento" = ANY($1::int[])`,
            [subIds],
          );
          if (bolIds.length > 0) {
            await db.query(`DELETE FROM boleto WHERE "idBoleto" = ANY($1::int[])`, [bolIds]);
          }
        }

        await db.query(`DELETE FROM "eventoPersonalLogistica" WHERE "idEvento" = ANY($1::int[])`, [createdEventIds]);
        await db.query(`DELETE FROM "bitacoraEvento" WHERE "idEvento" = ANY($1::int[])`, [createdEventIds]);
        await db.query(`DELETE FROM "solicitudModificacion" WHERE "idEvento" = ANY($1::int[])`, [createdEventIds]);
        await db.query(`DELETE FROM "subEvento" WHERE "idEvento" = ANY($1::int[])`, [createdEventIds]);
        await db.query(`DELETE FROM evento WHERE "idEvento" = ANY($1::int[])`, [createdEventIds]);
        if (fechaIds.length > 0) {
          await db.query(`DELETE FROM fecha WHERE "idFecha" = ANY($1::int[])`, [fechaIds]);
        }
      }

      if (tempLabId !== null) {
        await db.query(`DELETE FROM "estadoEquipo" WHERE "idRecinto" = $1`, [tempLabId]);
        await db.query(`DELETE FROM recinto WHERE "idRecinto" = $1`, [tempLabId]);
      }

      if (createdUserIds.length > 0) {
        await db.query(`DELETE FROM usuario WHERE "idUsuario" = ANY($1::int[])`, [createdUserIds]);
      }
    } catch (cleanupErr) {
      console.warn("Advertencia durante limpieza E2E modalidades:", cleanupErr);
    }
    await db.end();
    await driver.quit();
  }
}

runModalidadesYCambioRecintoSuite().catch((err) => {
  console.error("\nFALLÓ SUITE E2E MODALIDADES Y CAMBIO DE RECINTO:", err);
  process.exit(1);
});
