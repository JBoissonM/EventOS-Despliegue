import { describe, expect, it } from 'bun:test';
import {
  AlcanceEvento,
  EstadoBoleto,
  EstadoEvento,
  TipoCuentaUsuario,
} from '@eventos/shared';
import { OrganizadorService } from './organizador.service';

function crearOrganizadorServiceTest(overrides?: {
  evento?: Record<string, any>;
  usuario?: Record<string, any> | null;
  invitacion?: Record<string, any> | null;
  boletosCancelados?: Array<{ idBoleto: number }>;
  subeventos?: Array<Record<string, any>>;
}) {
  const queriesEjecutadas: Array<{ sql: string; params?: any[] }> = [];
  const correosEnviados: Array<{ tipo: string; payload: any }> = [];
  const ponentesGuardados: any[] = [];
  let transaccionConfirmada = false;
  let transaccionRevertida = false;

  const eventoBase = overrides?.evento ?? {
    idEvento: 10,
    nombre: 'Evento de Prueba',
    descripcion: 'Descripción de prueba',
    justificacion: 'Justificación de prueba',
    idAlcance: AlcanceEvento.PUBLICO,
    idEstadoEvento: EstadoEvento.ACEPTADO,
    idOrganizador: 1,
    poster: 'poster.jpg',
  };

  const managerMock = {
    save: async (_entity: any, obj: any) => obj,
    findOne: async () => overrides?.invitacion ?? null,
    delete: async (_entity: any, criteria: any) => {
      queriesEjecutadas.push({ sql: 'MANAGER_DELETE', params: [criteria] });
      return { affected: 1 };
    },
    query: async (sql: string, params?: any[]) => {
      queriesEjecutadas.push({ sql, params });
      if (sql.includes('UPDATE "boleto"')) {
        return overrides?.boletosCancelados ?? [];
      }
      return [];
    },
  };

  const dataSourceMock = {
    query: async (sql: string, params?: any[]) => {
      queriesEjecutadas.push({ sql, params });
      if (sql.includes('COUNT(*)::int AS total')) {
        return [{ total: 0 }];
      }
      return [];
    },
    createQueryRunner: () => ({
      connect: async () => {},
      startTransaction: async () => {},
      commitTransaction: async () => {
        transaccionConfirmada = true;
      },
      rollbackTransaction: async () => {
        transaccionRevertida = true;
      },
      release: async () => {},
      manager: managerMock,
    }),
  };

  const eventoRepositoryMock = {
    findOne: async () => ({ ...eventoBase }),
    findOneBy: async () => ({ ...eventoBase }),
    save: async (e: any) => e,
  };

  const ponenteRepositoryMock = {
    delete: async (criteria: any) => {
      queriesEjecutadas.push({ sql: 'DELETE_PONENTES', params: [criteria] });
    },
    create: (data: any) => data,
    save: async (items: any[]) => {
      ponentesGuardados.push(...items);
      return items;
    },
  };

  const subEventoRepositoryMock = {
    find: async () =>
      overrides?.subeventos ?? [
        { idSubEvento: 100, idEvento: 10, nombre: 'Sub 1', descripcion: 'Desc' },
      ],
    findOne: async () => null,
    save: async (s: any) => s,
  };

  const usuarioRepositoryMock = {
    findOneBy: async () => overrides?.usuario ?? null,
    findOne: async () => overrides?.usuario ?? null,
  };

  const mailServiceMock = {
    enviarConfirmacionAsignacionLogistica: async (payload: any) => {
      correosEnviados.push({ tipo: 'confirmacion_logistica', payload });
    },
    enviarInvitacionLogistica: async (payload: any) => {
      correosEnviados.push({ tipo: 'invitacion_logistica', payload });
    },
    enviarNotificacionBoletoCanceladoPorRevocacion: async (payload: any) => {
      correosEnviados.push({ tipo: 'cancelacion_revocacion', payload });
    },
  };

  const service = new OrganizadorService(
    eventoRepositoryMock as any,
    ponenteRepositoryMock as any,
    subEventoRepositoryMock as any,
    { findOne: async () => null } as any,
    { findOne: async () => null, delete: async () => {} } as any,
    usuarioRepositoryMock as any,
    {} as any,
    { resolvePublicUrl: (k: string) => k } as any,
    dataSourceMock as any,
    { sign: () => 'jwt-token' } as any,
    mailServiceMock as any,
  );

  return {
    service,
    queriesEjecutadas,
    correosEnviados,
    ponentesGuardados,
    getTransaccionEstado: () => ({
      transaccionConfirmada,
      transaccionRevertida,
    }),
  };
}

describe('OrganizadorService - Flujos diferidos, revocación y alcances', () => {
  it('agregarPersonalLogistica con soloVerificar=true NO inserta en BD ni envía correo aunque el usuario exista', async () => {
    const { service, queriesEjecutadas, correosEnviados } =
      crearOrganizadorServiceTest({
        usuario: {
          idUsuario: 42,
          nombre: 'Laura',
          apellidoPa: 'Gómez',
          correo: 'laura@ipn.mx',
        },
      });

    const res = await service.agregarPersonalLogistica(
      10,
      1,
      { correo: 'laura@ipn.mx', soloVerificar: true },
      TipoCuentaUsuario.INTERNO,
    );

    expect(res).toEqual({
      asignadoDirecto: true,
      invitacionEnviada: false,
      mensaje: 'Usuario verificado.',
    });
    expect(
      queriesEjecutadas.some((q) =>
        q.sql.includes('INSERT INTO "eventoPersonalLogistica"'),
      ),
    ).toBe(false);
    expect(correosEnviados).toHaveLength(0);
  });

  it('agregarPersonalLogistica con soloVerificar=false inserta en BD y envía confirmación', async () => {
    const { service, queriesEjecutadas, correosEnviados } =
      crearOrganizadorServiceTest({
        usuario: {
          idUsuario: 42,
          nombre: 'Laura',
          apellidoPa: 'Gómez',
          correo: 'laura@ipn.mx',
        },
      });

    const res = await service.agregarPersonalLogistica(
      10,
      1,
      { correo: 'laura@ipn.mx', soloVerificar: false },
      TipoCuentaUsuario.INTERNO,
    );

    expect(res.asignadoDirecto).toBe(true);
    expect(
      queriesEjecutadas.some((q) =>
        q.sql.includes('INSERT INTO "eventoPersonalLogistica"'),
      ),
    ).toBe(true);
    expect(correosEnviados).toHaveLength(1);
    expect(correosEnviados[0].tipo).toBe('confirmacion_logistica');
  });

  it('revocarInvitacionPrivada cancela boletos activos, limpia retenciones y envía correo si había boleto cancelado', async () => {
    const { service, queriesEjecutadas, correosEnviados, getTransaccionEstado } =
      crearOrganizadorServiceTest({
        invitacion: {
          idInvitacionEvento: 77,
          idEvento: 10,
          idUsuario: 55,
          usuario: {
            idUsuario: 55,
            nombre: 'Carlos',
            apellidoPa: 'Pérez',
            correo: 'carlos@ipn.mx',
          },
        },
        boletosCancelados: [{ idBoleto: 901 }],
      });

    const res = await service.revocarInvitacionPrivada(10, 77, 1);

    expect(res.boletosCancelados).toBe(1);
    expect(getTransaccionEstado().transaccionConfirmada).toBe(true);
    const updateBoleto = queriesEjecutadas.find((q) =>
      q.sql.includes('UPDATE "boleto"'),
    );
    expect(updateBoleto?.params?.[0]).toBe(EstadoBoleto.CANCELADO);
    expect(updateBoleto?.params?.[1]).toBe(EstadoBoleto.VALIDO);
    expect(
      queriesEjecutadas.some((q) => q.sql.includes('DELETE FROM "retencionAsiento"')),
    ).toBe(true);
    expect(
      queriesEjecutadas.some((q) => q.sql === 'MANAGER_DELETE'),
    ).toBe(true);
    expect(correosEnviados).toHaveLength(1);
    expect(correosEnviados[0].tipo).toBe('cancelacion_revocacion');
    expect(correosEnviados[0].payload.destinatario).toBe('carlos@ipn.mx');
  });

  it('revocarInvitacionPrivada NO envía correo si el invitado no tenía boletos activos', async () => {
    const { service, correosEnviados, getTransaccionEstado } =
      crearOrganizadorServiceTest({
        invitacion: {
          idInvitacionEvento: 78,
          idEvento: 10,
          idUsuario: 56,
          usuario: {
            idUsuario: 56,
            nombre: 'Sofía',
            apellidoPa: 'Ruiz',
            correo: 'sofia@ipn.mx',
          },
        },
        boletosCancelados: [],
      });

    const res = await service.revocarInvitacionPrivada(10, 78, 1);

    expect(res.boletosCancelados).toBe(0);
    expect(getTransaccionEstado().transaccionConfirmada).toBe(true);
    expect(correosEnviados).toHaveLength(0);
  });

  it('actualizarInfoGeneral permite guardar múltiples ponentes distintos sin correo', async () => {
    const { service, ponentesGuardados } = crearOrganizadorServiceTest();

    await service.actualizarInfoGeneral(10, 1, {
      ponentes: [
        { nombre: 'Dr.', apellidoPa: 'Juan', apellidoMa: 'Pérez', correo: '' },
        { nombre: 'Dra.', apellidoPa: 'Ana', apellidoMa: 'López', correo: '' },
      ],
    });

    expect(ponentesGuardados).toHaveLength(2);
    expect(ponentesGuardados[0].correo).toBe('');
    expect(ponentesGuardados[1].correo).toBe('');
  });

  it('actualizarInfoGeneral al cambiar a PRIVADO incorpora asistentes con boleto activo a invitacionEvento', async () => {
    const { service, queriesEjecutadas, getTransaccionEstado } =
      crearOrganizadorServiceTest({
        evento: {
          idEvento: 10,
          nombre: 'Evento',
          descripcion: 'Desc',
          justificacion: 'Just',
          idAlcance: AlcanceEvento.PUBLICO,
          idEstadoEvento: EstadoEvento.ACEPTADO,
          idOrganizador: 1,
          poster: 'p.jpg',
        },
      });

    await service.actualizarInfoGeneral(10, 1, {
      idAlcance: AlcanceEvento.PRIVADO,
    });

    expect(getTransaccionEstado().transaccionConfirmada).toBe(true);
    expect(
      queriesEjecutadas.some((q) =>
        q.sql.includes('INSERT INTO "invitacionEvento"'),
      ),
    ).toBe(true);
  });

  it('actualizarInfoGeneral al pasar de PRIVADO a PUBLICO limpia invitacionEvento', async () => {
    const { service, queriesEjecutadas, getTransaccionEstado } =
      crearOrganizadorServiceTest({
        evento: {
          idEvento: 10,
          nombre: 'Evento',
          descripcion: 'Desc',
          justificacion: 'Just',
          idAlcance: AlcanceEvento.PRIVADO,
          idEstadoEvento: EstadoEvento.ACEPTADO,
          idOrganizador: 1,
          poster: 'p.jpg',
        },
      });

    await service.actualizarInfoGeneral(10, 1, {
      idAlcance: AlcanceEvento.PUBLICO,
    });

    expect(getTransaccionEstado().transaccionConfirmada).toBe(true);
    expect(
      queriesEjecutadas.some((q) =>
        q.sql.includes('DELETE FROM "invitacionEvento"'),
      ),
    ).toBe(true);
  });
});
