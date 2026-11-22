import { describe, expect, it } from 'bun:test';
import { ForbiddenException } from '@nestjs/common';
import {
  AlcanceEvento,
  EstadoEvento,
  EstadoSubEvento,
  ModalidadAcceso,
  TipoCuentaUsuario,
} from '@eventos/shared';
import { EventosService } from './eventos.service';

function crearEventosServiceTest(params: {
  idAlcance: AlcanceEvento;
  subEventosInvitadosIds?: number[];
  esLogistica?: boolean;
  tieneBoletoPrevio?: boolean;
  subEventosCustom?: Array<Record<string, any>>;
}) {
  const eventoMock = {
    idEvento: 20,
    nombre: 'Evento Privado o Interno',
    descripcion: 'Descripción del evento',
    idAlcance: params.idAlcance,
    idEstadoEvento: EstadoEvento.ACEPTADO,
    idOrganizador: 99,
    poster: 'poster.jpg',
  };

  const subEventosMock = params.subEventosCustom ?? [
    {
      idSubEvento: 201,
      idEvento: 20,
      nombre: 'Actividad 1',
      descripcion: 'Desc act',
      estado: EstadoSubEvento.ACEPTADO,
      idModalidadAcceso: ModalidadAcceso.QR_GENERAL,
      idFecha: 1,
      idRecinto: 1,
    },
  ];

  const dataSourceMock = {
    query: async (sql: string) => {
      if (sql.includes('FROM "invitacionEvento"')) {
        return (params.subEventosInvitadosIds ?? []).map((idSubEvento) => ({
          idSubEvento,
        }));
      }
      if (sql.includes('FROM "eventoPersonalLogistica"')) {
        return params.esLogistica ? [{ '?column?': 1 }] : [];
      }
      if (sql.includes('FROM "asistenteEvento"')) {
        return params.tieneBoletoPrevio ? [{ '?column?': 1 }] : [];
      }
      return [];
    },
    getRepository: (name: string) => ({
      findOne: async () =>
        name === 'recinto'
          ? { idRecinto: 1, nombre: 'Sala 14', aforo: 40 }
          : {
              idFecha: 1,
              fecha: '2026-12-10',
              horaInicio: '10:00:00',
              horaFin: '12:00:00',
            },
    }),
  };

  return new EventosService(
    { findOne: async () => eventoMock } as any,
    {} as any,
    { find: async () => subEventosMock } as any,
    {} as any,
    { find: async () => [] } as any,
    { count: async () => 0 } as any,
    dataSourceMock as any,
    { resolvePublicUrl: (k: string) => k } as any,
  );
}

describe('EventosService - Acceso a Eventos Privados e Internos con boleto previo', () => {
  it('lanza ForbiddenException (403) al consultar un evento privado sin sesión activa', async () => {
    const service = crearEventosServiceTest({ idAlcance: AlcanceEvento.PRIVADO });

    await expect(service.obtenerDetalleEventoPublico(20)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('lanza ForbiddenException (403) cuando un usuario autenticado sin invitación consulta evento privado', async () => {
    const service = crearEventosServiceTest({
      idAlcance: AlcanceEvento.PRIVADO,
      subEventosInvitadosIds: [],
      esLogistica: false,
    });

    await expect(
      service.obtenerDetalleEventoPublico(20, {
        sub: 50,
        tipoCuenta: TipoCuentaUsuario.INTERNO,
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('permite acceso al evento privado cuando el usuario está invitado y filtra solo sus subeventos invitados', async () => {
    const service = crearEventosServiceTest({
      idAlcance: AlcanceEvento.PRIVADO,
      subEventosInvitadosIds: [202],
      subEventosCustom: [
        {
          idSubEvento: 201,
          idEvento: 20,
          nombre: 'Actividad Privada A',
          descripcion: 'Desc A',
          estado: EstadoSubEvento.ACEPTADO,
          idModalidadAcceso: ModalidadAcceso.QR_GENERAL,
          idFecha: 1,
          idRecinto: 1,
        },
        {
          idSubEvento: 202,
          idEvento: 20,
          nombre: 'Actividad Privada B',
          descripcion: 'Desc B',
          estado: EstadoSubEvento.ACEPTADO,
          idModalidadAcceso: ModalidadAcceso.QR_GENERAL,
          idFecha: 1,
          idRecinto: 1,
        },
      ],
    });

    const detalle = await service.obtenerDetalleEventoPublico(20, {
      sub: 50,
      tipoCuenta: TipoCuentaUsuario.EXTERNO,
    });

    expect(detalle.idEvento).toBe(20);
    expect(detalle.subEventos).toHaveLength(1);
    expect(detalle.subEventos[0].idSubEvento).toBe(202);
  });

  it('bloquea a un usuario externo en evento INTERNO si no tiene boleto previo', async () => {
    const service = crearEventosServiceTest({
      idAlcance: AlcanceEvento.INTERNO,
      tieneBoletoPrevio: false,
    });

    await expect(
      service.obtenerDetalleEventoPublico(20, {
        sub: 60,
        tipoCuenta: TipoCuentaUsuario.EXTERNO,
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('permite consultar el detalle de un evento INTERNO a un usuario externo que ya tiene boleto previo', async () => {
    const service = crearEventosServiceTest({
      idAlcance: AlcanceEvento.INTERNO,
      tieneBoletoPrevio: true,
    });

    const detalle = await service.obtenerDetalleEventoPublico(20, {
      sub: 60,
      tipoCuenta: TipoCuentaUsuario.EXTERNO,
    });

    expect(detalle.idEvento).toBe(20);
  });
});
