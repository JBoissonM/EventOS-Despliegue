import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import type { InvitadoEventoItem, PersonalLogisticaItem } from "@eventos/shared";
import {
  agregarInvitadosLocales,
  sincronizarInvitadosYLogistica,
  tienenCambiosInvitados,
  tienenCambiosPersonalLogistica,
} from "../../apps/frontend/src/features/organizer/deferredOrganizerSync";

describe("deferredOrganizerSync", () => {
  const originalFetch = globalThis.fetch;
  const originalLocalStorage = globalThis.localStorage;

  beforeEach(() => {
    (globalThis as any).localStorage = {
      getItem: () => "fake-jwt-token",
    };
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    (globalThis as any).localStorage = originalLocalStorage;
  });

  it("agregarInvitadosLocales normaliza correos, evita duplicados y los marca pendientes", () => {
    const iniciales: InvitadoEventoItem[] = [
      {
        idInvitacionEvento: 1,
        idUsuario: 10,
        nombreCompleto: "Ana López",
        correo: "ana@ipn.mx",
        fechaUltimoEnvio: "2026-11-17T10:00:00.000Z",
        puedeReenviar: false,
        horasRestantesCooldown: 8,
      },
    ];

    const resultado = agregarInvitadosLocales(iniciales, [
      { id: 1, nombre: "", correo: " ANA@ipn.mx " },
      { id: 2, nombre: "", correo: " Carlos@ipn.mx " },
      { id: 3, nombre: "", correo: "carlos@ipn.mx" },
    ]);

    expect(resultado).toHaveLength(2);
    expect(resultado[1].correo).toBe("carlos@ipn.mx");
    expect(resultado[1].idInvitacionEvento).toBe(0);
  });

  it("detecta cambios en invitados y personal de logística por conjunto de elementos", () => {
    const invA: InvitadoEventoItem = {
      idInvitacionEvento: 1,
      idUsuario: 10,
      nombreCompleto: "Ana",
      correo: "ana@ipn.mx",
      fechaUltimoEnvio: "",
      puedeReenviar: false,
      horasRestantesCooldown: 8,
    };
    const invB: InvitadoEventoItem = {
      idInvitacionEvento: 0,
      idUsuario: -1,
      nombreCompleto: "",
      correo: "beto@ipn.mx",
      fechaUltimoEnvio: "",
      puedeReenviar: false,
      horasRestantesCooldown: 8,
    };

    expect(tienenCambiosInvitados([invA], [invA])).toBe(false);
    expect(tienenCambiosInvitados([invA, invB], [invA])).toBe(true);

    const log1: PersonalLogisticaItem = {
      idUsuario: 7,
      nombreCompleto: "Staff 1",
      correo: "staff1@ipn.mx",
      tipoCuenta: "Usuario Interno",
    };
    expect(tienenCambiosPersonalLogistica([log1], [log1])).toBe(false);
    expect(tienenCambiosPersonalLogistica([], [log1])).toBe(true);
  });

  it("sincronizarInvitadosYLogistica ejecuta POST de altas, DELETE de bajas y preserva nuevos invitados si fallan", async () => {
    const llamadas: Array<{ url: string; method: string; body?: string }> = [];

    (globalThis as any).fetch = async (url: string, init?: RequestInit) => {
      const method = init?.method ?? "GET";
      const body = typeof init?.body === "string" ? init.body : undefined;
      llamadas.push({ url, method, body });

      if (body?.includes("falla@ipn.mx")) {
        return new Response(
          JSON.stringify({
            message:
              "No se encontró una cuenta activa para el destinatario del boleto directo.",
          }),
          { status: 404, headers: { "Content-Type": "application/json" } },
        );
      }

      return new Response(
        JSON.stringify({ mensaje: "Operación realizada con éxito." }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    };

    const invExistente: InvitadoEventoItem = {
      idInvitacionEvento: 55,
      idUsuario: 10,
      nombreCompleto: "Ana",
      correo: "ana@ipn.mx",
      fechaUltimoEnvio: "",
      puedeReenviar: false,
      horasRestantesCooldown: 8,
    };
    const invNuevoOk: InvitadoEventoItem = {
      idInvitacionEvento: 0,
      idUsuario: -1,
      nombreCompleto: "",
      correo: "nuevo@ipn.mx",
      fechaUltimoEnvio: "",
      puedeReenviar: false,
      horasRestantesCooldown: 8,
    };
    const invNuevoFalla: InvitadoEventoItem = {
      idInvitacionEvento: 0,
      idUsuario: -2,
      nombreCompleto: "",
      correo: "falla@ipn.mx",
      fechaUltimoEnvio: "",
      puedeReenviar: false,
      horasRestantesCooldown: 8,
    };
    const staffEliminado: PersonalLogisticaItem = {
      idUsuario: 99,
      nombreCompleto: "Staff",
      correo: "staff@ipn.mx",
      tipoCuenta: "Usuario Interno",
    };

    const res = await sincronizarInvitadosYLogistica({
      idEvento: "12",
      invitadosActuales: [invNuevoOk, invNuevoFalla],
      invitadosIniciales: [invExistente],
      personalActual: [],
      personalInicial: [staffEliminado],
    });

    expect(res.huboCambiosAplicados).toBe(true);
    expect(res.errores).toHaveLength(1);
    expect(res.invitadosNuevosFallidos).toHaveLength(1);
    expect(res.invitadosNuevosFallidos[0].correo).toBe("falla@ipn.mx");
    expect(llamadas.map((l) => `${l.method} ${l.url.split("/api/")[1]}`)).toEqual([
      "POST eventos/12/invitados",
      "POST eventos/12/invitados",
      "DELETE eventos/12/invitados/55",
      "DELETE eventos/12/personal-logistica/99",
    ]);
  });
});
