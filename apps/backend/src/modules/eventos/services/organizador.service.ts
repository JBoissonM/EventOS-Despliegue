import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import {
  AlcanceEvento,
  EstadoBoleto,
  EstadoEvento,
  type EventoOrganizadorDetalle,
  type EventoOrganizadorDetalleSubevento,
  type InvitadoEventoItem,
  type MisEventosItem,
  type Ponente,
  type PrimerSubeventoResumen,
} from '@eventos/shared';
import { EventoEntity } from '../entities/evento.entity';
import { PonenteEntity } from '../entities/ponente.entity';
import { SubEventoEntity } from '../entities/subevento.entity';
import { SolicitudModificacionEntity } from '../entities/solicitudModificacion.entity';
import { InvitacionEventoEntity } from '../entities/invitacionEvento.entity';
import { UsuarioEntity } from '../../auth/entities/usuario.entity';
import { SolicitudesService } from './solicitudes.service';
import { ModificarLogisticaDto } from '../dto/modificarLogistica.dto';
import { ActualizarInfoGeneralDto } from '../dto/actualizarInfoGeneral.dto';
import { AgregarInvitadoDto } from '../dto/invitadoPrivado.dto';
import { StorageService } from '../../../common/storage/storage.service';

@Injectable()
export class OrganizadorService {
  constructor(
    @InjectRepository(EventoEntity)
    private readonly eventoRepository: Repository<EventoEntity>,
    @InjectRepository(PonenteEntity)
    private readonly ponenteRepository: Repository<PonenteEntity>,
    @InjectRepository(SubEventoEntity)
    private readonly subEventoRepository: Repository<SubEventoEntity>,
    @InjectRepository(SolicitudModificacionEntity)
    private readonly solicitudModificacionRepository: Repository<SolicitudModificacionEntity>,
    @InjectRepository(InvitacionEventoEntity)
    private readonly invitacionRepository: Repository<InvitacionEventoEntity>,
    @InjectRepository(UsuarioEntity)
    private readonly usuarioRepository: Repository<UsuarioEntity>,
    private readonly solicitudesService: SolicitudesService,
    private readonly storageService: StorageService,
    private readonly dataSource: DataSource,
  ) {}

  private obtenerPosterUrl(poster?: string | null): string | null {
    if (!poster) return null;
    return poster.startsWith('http://') || poster.startsWith('https://')
      ? poster
      : this.storageService.publicUrl(poster);
  }

  private async contarBoletosValidosPorSubevento(
    subEventoIds: number[],
  ): Promise<Map<number, number>> {
    const boletosPorSubevento = new Map<number, number>();
    if (subEventoIds.length === 0) {
      return boletosPorSubevento;
    }

    const conteos: { idSubEvento: number; total: string }[] =
      await this.dataSource.query(
        `SELECT ae."idSubEvento", COUNT(b."idBoleto") as total
         FROM "asistenteEvento" ae
         INNER JOIN "boleto" b ON ae."idBoleto" = b."idBoleto"
         WHERE ae."idSubEvento" = ANY($1) AND b."idEstadoBoleto" = $2
         GROUP BY ae."idSubEvento"`,
        [subEventoIds, EstadoBoleto.VALIDO],
      );

    for (const row of conteos) {
      boletosPorSubevento.set(Number(row.idSubEvento), Number(row.total));
    }

    return boletosPorSubevento;
  }

  async obtenerMisEventos(idOrganizador: number): Promise<MisEventosItem[]> {
    const eventos = await this.eventoRepository.find({
      where: { idOrganizador },
      relations: {
        subEventos: {
          fecha: true,
          recinto: true,
        },
      },
      order: { idEvento: 'DESC' },
    });

    if (eventos.length === 0) {
      return [];
    }

    const subEventoIds = eventos
      .flatMap((e) => e.subEventos || [])
      .map((s) => s.idSubEvento);

    const boletosPorSubevento =
      await this.contarBoletosValidosPorSubevento(subEventoIds);

    return eventos.map((evento) => {
      const subeventos = [...(evento.subEventos || [])].sort((a, b) => {
        const fechaA = a.fecha?.fecha
          ? `${a.fecha.fecha}T${a.fecha.horaInicio || '00:00'}`
          : '';
        const fechaB = b.fecha?.fecha
          ? `${b.fecha.fecha}T${b.fecha.horaInicio || '00:00'}`
          : '';
        return fechaA.localeCompare(fechaB);
      });

      const primerSub = subeventos[0] || null;
      const primerSubevento: PrimerSubeventoResumen | null = primerSub
        ? {
            idSubEvento: primerSub.idSubEvento,
            nombre: primerSub.nombre,
            fecha: primerSub.fecha ? primerSub.fecha.fecha : null,
            horaInicio: primerSub.fecha ? primerSub.fecha.horaInicio : null,
            horaFin: primerSub.fecha ? primerSub.fecha.horaFin : null,
            nombreRecinto: primerSub.recinto ? primerSub.recinto.nombre : null,
          }
        : null;

      const cupoMaximo = primerSub?.recinto?.aforo ?? 0;
      const boletosEmitidos = subeventos.reduce(
        (acc, sub) => acc + (boletosPorSubevento.get(sub.idSubEvento) || 0),
        0,
      );

      return {
        idEvento: evento.idEvento,
        nombre: evento.nombre,
        descripcion: evento.descripcion,
        justificacion: evento.justificacion,
        poster: evento.poster,
        posterUrl: this.obtenerPosterUrl(evento.poster),
        idAlcance: evento.idAlcance,
        idEstadoEvento: evento.idEstadoEvento,
        cupoMaximo,
        boletosEmitidos,
        primerSubevento,
      };
    });
  }

  async obtenerDetalleOrganizador(
    idEvento: number,
    idOrganizador: number,
  ): Promise<EventoOrganizadorDetalle> {
    const evento = await this.eventoRepository.findOne({
      where: { idEvento },
      relations: {
        subEventos: {
          fecha: true,
          recinto: true,
        },
      },
    });

    if (!evento) {
      throw new NotFoundException('No se encontró el evento solicitado.');
    }

    if (evento.idOrganizador !== idOrganizador) {
      throw new ForbiddenException(
        'No tienes permisos para administrar este evento.',
      );
    }

    const subeventos = [...(evento.subEventos || [])].sort((a, b) => {
      const fechaA = a.fecha?.fecha
        ? `${a.fecha.fecha}T${a.fecha.horaInicio || '00:00'}`
        : '';
      const fechaB = b.fecha?.fecha
        ? `${b.fecha.fecha}T${b.fecha.horaInicio || '00:00'}`
        : '';
      return fechaA.localeCompare(fechaB);
    });

    const subEventoIds = subeventos.map((s) => s.idSubEvento);
    const boletosPorSubevento =
      await this.contarBoletosValidosPorSubevento(subEventoIds);

    const ponentesPorSubevento = new Map<number, Ponente[]>();
    if (subEventoIds.length > 0) {
      const ponentes = await this.ponenteRepository.find({
        where: subEventoIds.map((id) => ({ idSubEvento: id })),
      });
      for (const ponente of ponentes) {
        const lista = ponentesPorSubevento.get(ponente.idSubEvento) || [];
        lista.push({
          idPonente: ponente.idPonente,
          nombre: ponente.nombre,
          apellidoPa: ponente.apellidoPa,
          apellidoMa: ponente.apellidoMa,
          correo: ponente.correo,
          idSubEvento: ponente.idSubEvento,
        });
        ponentesPorSubevento.set(ponente.idSubEvento, lista);
      }
    }

    let boletosActivosCount = 0;
    const subEventosDetallados: EventoOrganizadorDetalleSubevento[] =
      subeventos.map((sub) => {
        const emitidos = boletosPorSubevento.get(sub.idSubEvento) || 0;
        boletosActivosCount += emitidos;

        return {
          idSubEvento: sub.idSubEvento,
          nombre: sub.nombre,
          descripcion: sub.descripcion,
          accesoQR: sub.accesoQR,
          estado: sub.estado,
          fecha: sub.fecha
            ? {
                idFecha: sub.fecha.idFecha,
                fecha: sub.fecha.fecha,
                horaInicio: sub.fecha.horaInicio,
                horaFin: sub.fecha.horaFin,
              }
            : null,
          recinto: sub.recinto
            ? {
                idRecinto: sub.recinto.idRecinto,
                nombre: sub.recinto.nombre,
                aforo: sub.recinto.aforo,
                idEstadoRecinto: sub.recinto.idEstadoRecinto,
              }
            : null,
          ponentes: ponentesPorSubevento.get(sub.idSubEvento) || [],
          boletosEmitidos: emitidos,
        };
      });

    const primerSub = subeventos[0];
    const cupoMaximo = primerSub?.recinto?.aforo ?? 0;

    const solicitudPendiente =
      await this.solicitudModificacionRepository.findOne({
        where: { idEvento, estado: 'Pendiente' },
      });

    let invitadosDetallados: InvitadoEventoItem[] | undefined = undefined;
    if (evento.idAlcance === AlcanceEvento.PRIVADO) {
      const invitaciones = await this.invitacionRepository.find({
        where: { idEvento, estado: 'Activa' },
        relations: { usuario: true },
        order: { idInvitacionEvento: 'ASC' },
      });

      const ahora = Date.now();
      const OCHO_HORAS_MS = 8 * 60 * 60 * 1000;

      invitadosDetallados = invitaciones.map((inv) => {
        const fechaEnvioMs = inv.fechaUltimoEnvio
          ? new Date(inv.fechaUltimoEnvio).getTime()
          : 0;
        const tiempoTranscurrido = ahora - fechaEnvioMs;
        const puedeReenviar = tiempoTranscurrido >= OCHO_HORAS_MS;
        const msRestantes = Math.max(0, OCHO_HORAS_MS - tiempoTranscurrido);
        const horasRestantesCooldown = puedeReenviar
          ? 0
          : Math.ceil(msRestantes / (60 * 60 * 1000));

        const usr = inv.usuario;
        const nombreCompleto = usr
          ? `${usr.nombre} ${usr.apellidoPa}${usr.apellidoMa ? ' ' + usr.apellidoMa : ''}`
          : 'Invitado';

        return {
          idInvitacionEvento: inv.idInvitacionEvento,
          idUsuario: inv.idUsuario,
          nombreCompleto,
          correo: usr?.correo ?? '',
          fechaUltimoEnvio: inv.fechaUltimoEnvio
            ? new Date(inv.fechaUltimoEnvio).toISOString()
            : '',
          puedeReenviar,
          horasRestantesCooldown,
        };
      });
    }

    return {
      idEvento: evento.idEvento,
      nombre: evento.nombre,
      descripcion: evento.descripcion,
      justificacion: evento.justificacion,
      poster: evento.poster,
      posterUrl: this.obtenerPosterUrl(evento.poster),
      idAlcance: evento.idAlcance,
      idEstadoEvento: evento.idEstadoEvento,
      esUrgente: evento.esUrgente,
      idOrganizador: evento.idOrganizador,
      cupoMaximo,
      boletosActivosCount,
      subEventos: subEventosDetallados,
      solicitudModificacionPendiente: solicitudPendiente
        ? {
            idSolicitudModificacion: solicitudPendiente.idSolicitudModificacion,
            motivoModificacion: solicitudPendiente.motivoModificacion,
            subeventosPropuestos: solicitudPendiente.subeventosPropuestos,
            estado: solicitudPendiente.estado,
          }
        : null,
      invitados: invitadosDetallados,
    };
  }

  async solicitarModificacionLogistica(
    idEvento: number,
    idUsuario: number,
    dto: ModificarLogisticaDto,
  ) {
    const evento = await this.eventoRepository.findOne({
      where: { idEvento },
      relations: {
        subEventos: {
          fecha: true,
          recinto: true,
        },
      },
    });

    if (!evento) {
      throw new NotFoundException('No se encontró el evento solicitado.');
    }

    if (evento.idOrganizador !== idUsuario) {
      throw new ForbiddenException(
        'No tienes permisos para administrar este evento.',
      );
    }

    if (
      evento.idEstadoEvento === EstadoEvento.CANCELADO ||
      evento.idEstadoEvento === EstadoEvento.FINALIZADO ||
      evento.idEstadoEvento === EstadoEvento.RECHAZADO
    ) {
      throw new ConflictException('Evento finalizado o inactivo.');
    }

    if (evento.idEstadoEvento === EstadoEvento.ACEPTADO) {
      const { fechaHoy } = this.solicitudesService.obtenerAhoraCDMX();
      for (const sub of evento.subEventos || []) {
        if (sub.fecha?.fecha) {
          const dias = this.solicitudesService.calcularDiasDiferencia(
            sub.fecha.fecha,
            fechaHoy,
          );
          if (dias < 7) {
            throw new BadRequestException(
              'Las modificaciones logísticas deben solicitarse con al menos 7 días naturales de anticipación a la realización del evento.',
            );
          }
        }
      }

      for (const sub of dto.subeventos) {
        const dias = this.solicitudesService.calcularDiasDiferencia(
          sub.fecha,
          fechaHoy,
        );
        if (dias < 7) {
          throw new BadRequestException(
            'Las modificaciones logísticas deben solicitarse con al menos 7 días naturales de anticipación a la realización del evento.',
          );
        }
      }
    }

    await this.solicitudesService.validarSubeventos(dto.subeventos, idEvento);

    const solicitudExistente =
      await this.solicitudModificacionRepository.findOne({
        where: { idEvento, estado: 'Pendiente' },
      });

    if (solicitudExistente) {
      solicitudExistente.subeventosPropuestos = dto.subeventos;
      solicitudExistente.motivoModificacion = dto.motivoModificacion.trim();
      const guardada =
        await this.solicitudModificacionRepository.save(solicitudExistente);
      return {
        mensaje:
          'Operación realizada con éxito. Evento en espera de revisión debido a cambio de duración.',
        idSolicitudModificacion: guardada.idSolicitudModificacion,
        idEvento,
        estado: guardada.estado,
        inFlightActualizada: true,
      };
    }

    const nuevaSolicitud = this.solicitudModificacionRepository.create({
      idEvento,
      motivoModificacion: dto.motivoModificacion.trim(),
      subeventosPropuestos: dto.subeventos,
      estado: 'Pendiente',
    });

    const guardada =
      await this.solicitudModificacionRepository.save(nuevaSolicitud);

    return {
      mensaje:
        'Operación realizada con éxito. Evento en espera de revisión debido a cambio de duración.',
      idSolicitudModificacion: guardada.idSolicitudModificacion,
      idEvento,
      estado: guardada.estado,
      inFlightActualizada: false,
    };
  }

  async actualizarInfoGeneral(
    idEvento: number,
    idUsuario: number,
    dto: ActualizarInfoGeneralDto,
    posterFile?: Express.Multer.File,
  ) {
    const evento = await this.eventoRepository.findOne({
      where: { idEvento },
    });

    if (!evento) {
      throw new NotFoundException('No se encontró el evento solicitado.');
    }

    if (evento.idOrganizador !== idUsuario) {
      throw new ForbiddenException(
        'No tienes permisos para administrar este evento.',
      );
    }

    if (
      evento.idEstadoEvento === EstadoEvento.CANCELADO ||
      evento.idEstadoEvento === EstadoEvento.FINALIZADO ||
      evento.idEstadoEvento === EstadoEvento.RECHAZADO
    ) {
      throw new ConflictException('Evento finalizado o inactivo.');
    }

    if (posterFile) {
      const posterKey = await this.storageService.upload(
        posterFile,
        'posters',
        'public',
      );
      evento.poster = posterKey;
    } else if (
      dto.poster &&
      typeof dto.poster === 'string' &&
      dto.poster.trim() !== ''
    ) {
      evento.poster = dto.poster.trim();
    }

    if (dto.nombre !== undefined) {
      evento.nombre = dto.nombre.trim();
    }
    if (dto.descripcion !== undefined) {
      evento.descripcion = dto.descripcion.trim();
    }
    if (dto.justificacion !== undefined) {
      evento.justificacion = dto.justificacion.trim();
    }
    if (dto.idAlcance !== undefined) {
      evento.idAlcance = dto.idAlcance;
    }

    if (dto.ponentes !== undefined) {
      const subeventos = await this.subEventoRepository.find({
        where: { idEvento },
        order: { idSubEvento: 'ASC' },
      });

      if (subeventos.length === 0 && dto.ponentes.length > 0) {
        throw new BadRequestException(
          'El evento no cuenta con subeventos registrados para asociar ponentes.',
        );
      }

      const subEventosIdsValidos = new Set(
        subeventos.map((s) => s.idSubEvento),
      );
      const primerSubEventoId = subeventos[0]?.idSubEvento;

      const correosPorSubEvento = new Map<number, Set<string>>();

      for (const ponenteDto of dto.ponentes) {
        const idSub = ponenteDto.idSubEvento ?? primerSubEventoId;
        if (!subEventosIdsValidos.has(idSub)) {
          throw new BadRequestException(
            'El subevento asignado al ponente no pertenece a este evento.',
          );
        }

        const correoNormalizado = ponenteDto.correo.trim().toLowerCase();
        let correosSet = correosPorSubEvento.get(idSub);
        if (!correosSet) {
          correosSet = new Set<string>();
          correosPorSubEvento.set(idSub, correosSet);
        }

        if (correosSet.has(correoNormalizado)) {
          throw new ConflictException(
            'El ponente ya se encuentra registrado en el evento seleccionado.',
          );
        }
        correosSet.add(correoNormalizado);
      }

      const subEventoIdsArray = [...subEventosIdsValidos];
      if (subEventoIdsArray.length > 0) {
        await this.ponenteRepository.delete({
          idSubEvento: In(subEventoIdsArray),
        });
      }

      if (dto.ponentes.length > 0) {
        const nuevosPonentes = dto.ponentes.map((p) =>
          this.ponenteRepository.create({
            nombre: p.nombre.trim(),
            apellidoPa: p.apellidoPa.trim(),
            apellidoMa: p.apellidoMa ? p.apellidoMa.trim() : null,
            correo: p.correo.trim().toLowerCase(),
            idSubEvento: p.idSubEvento ?? primerSubEventoId,
          }),
        );
        await this.ponenteRepository.save(nuevosPonentes);
      }
    }

    const eventoGuardado = await this.eventoRepository.save(evento);

    return {
      mensaje: 'Operación realizada con éxito.',
      idEvento: eventoGuardado.idEvento,
      nombre: eventoGuardado.nombre,
      descripcion: eventoGuardado.descripcion,
      justificacion: eventoGuardado.justificacion,
      idAlcance: eventoGuardado.idAlcance,
      poster: eventoGuardado.poster,
      posterUrl: this.obtenerPosterUrl(eventoGuardado.poster),
    };
  }

  async agregarInvitadoPrivado(
    idEvento: number,
    idUsuario: number,
    dto: AgregarInvitadoDto,
  ) {
    const evento = await this.eventoRepository.findOne({
      where: { idEvento },
      relations: { subEventos: { recinto: true } },
    });

    if (!evento) {
      throw new NotFoundException('No se encontró el evento solicitado.');
    }

    if (evento.idOrganizador !== idUsuario) {
      throw new ForbiddenException(
        'No tienes permisos para administrar este evento.',
      );
    }

    if (
      evento.idEstadoEvento === EstadoEvento.CANCELADO ||
      evento.idEstadoEvento === EstadoEvento.FINALIZADO ||
      evento.idEstadoEvento === EstadoEvento.RECHAZADO
    ) {
      throw new ConflictException('Evento finalizado o inactivo.');
    }

    if (evento.idAlcance !== AlcanceEvento.PRIVADO) {
      throw new BadRequestException('El evento no cuenta con alcance privado.');
    }

    const correoBuscado = dto.correo.trim().toLowerCase();
    const usuarioDestinatario = await this.usuarioRepository.findOne({
      where: { correo: correoBuscado, estatus: true },
    });

    if (!usuarioDestinatario) {
      throw new NotFoundException(
        'No se encontró una cuenta activa para el destinatario del boleto directo.',
      );
    }

    const invitacionPrevia = await this.invitacionRepository.findOne({
      where: {
        idEvento,
        idUsuario: usuarioDestinatario.idUsuario,
        estado: 'Activa',
      },
    });

    if (invitacionPrevia) {
      throw new ConflictException(
        'El destinatario ya cuenta con un boleto activo para este evento.',
      );
    }

    const cupoMaximo = evento.subEventos?.[0]?.recinto?.aforo ?? 0;
    if (cupoMaximo > 0) {
      const totalInvitadosActivos = await this.invitacionRepository.count({
        where: { idEvento, estado: 'Activa' },
      });
      if (totalInvitadosActivos >= cupoMaximo) {
        throw new ConflictException(
          'La cantidad solicitada excede el límite disponible.',
        );
      }
    }

    const tokenInvitacion = randomUUID();
    const nuevaInvitacion = this.invitacionRepository.create({
      idEvento,
      idUsuario: usuarioDestinatario.idUsuario,
      tokenInvitacion,
      estado: 'Activa',
      fechaUltimoEnvio: new Date(),
    });

    const guardada = await this.invitacionRepository.save(nuevaInvitacion);

    const nombreCompleto = `${usuarioDestinatario.nombre} ${usuarioDestinatario.apellidoPa}${usuarioDestinatario.apellidoMa ? ' ' + usuarioDestinatario.apellidoMa : ''}`;

    return {
      mensaje: 'Operación realizada con éxito.',
      invitado: {
        idInvitacionEvento: guardada.idInvitacionEvento,
        idUsuario: guardada.idUsuario,
        nombreCompleto,
        correo: usuarioDestinatario.correo,
        tokenInvitacion: guardada.tokenInvitacion,
        fechaUltimoEnvio: guardada.fechaUltimoEnvio.toISOString(),
        puedeReenviar: false,
        horasRestantesCooldown: 8,
      },
    };
  }

  async reenviarInvitacionPrivada(
    idEvento: number,
    idInvitacion: number,
    idUsuario: number,
  ) {
    const evento = await this.eventoRepository.findOne({
      where: { idEvento },
    });

    if (!evento) {
      throw new NotFoundException('No se encontró el evento solicitado.');
    }

    if (evento.idOrganizador !== idUsuario) {
      throw new ForbiddenException(
        'No tienes permisos para administrar este evento.',
      );
    }

    if (
      evento.idEstadoEvento === EstadoEvento.CANCELADO ||
      evento.idEstadoEvento === EstadoEvento.FINALIZADO ||
      evento.idEstadoEvento === EstadoEvento.RECHAZADO
    ) {
      throw new ConflictException('Evento finalizado o inactivo.');
    }

    const invitacion = await this.invitacionRepository.findOne({
      where: {
        idInvitacionEvento: idInvitacion,
        idEvento,
        estado: 'Activa',
      },
      relations: { usuario: true },
    });

    if (!invitacion) {
      throw new NotFoundException('No se encontró la invitación solicitada.');
    }

    const ahora = Date.now();
    const fechaEnvioMs = new Date(invitacion.fechaUltimoEnvio).getTime();
    const transcurrido = ahora - fechaEnvioMs;
    const OCHO_HORAS_MS = 8 * 60 * 60 * 1000;

    if (transcurrido < OCHO_HORAS_MS) {
      const horasRestantes = Math.ceil(
        (OCHO_HORAS_MS - transcurrido) / (60 * 60 * 1000),
      );
      throw new ConflictException(
        `La invitación ya fue enviada recientemente. Disponible en ${horasRestantes} ${horasRestantes === 1 ? 'hora' : 'horas'}.`,
      );
    }

    invitacion.tokenInvitacion = randomUUID();
    invitacion.fechaUltimoEnvio = new Date();
    await this.invitacionRepository.save(invitacion);

    return {
      mensaje: 'Operación realizada con éxito.',
      idInvitacionEvento: invitacion.idInvitacionEvento,
      tokenInvitacion: invitacion.tokenInvitacion,
      fechaUltimoEnvio: invitacion.fechaUltimoEnvio.toISOString(),
      horasRestantesCooldown: 8,
      puedeReenviar: false,
    };
  }

  async revocarInvitacionPrivada(
    idEvento: number,
    idInvitacion: number,
    idUsuario: number,
  ) {
    const evento = await this.eventoRepository.findOne({
      where: { idEvento },
    });

    if (!evento) {
      throw new NotFoundException('No se encontró el evento solicitado.');
    }

    if (evento.idOrganizador !== idUsuario) {
      throw new ForbiddenException(
        'No tienes permisos para administrar este evento.',
      );
    }

    const invitacion = await this.invitacionRepository.findOne({
      where: {
        idInvitacionEvento: idInvitacion,
        idEvento,
      },
    });

    if (!invitacion) {
      throw new NotFoundException('No se encontró la invitación solicitada.');
    }

    invitacion.estado = 'Revocada';
    await this.invitacionRepository.save(invitacion);

    return {
      mensaje: 'Operación realizada con éxito.',
      idInvitacionEvento: invitacion.idInvitacionEvento,
      estado: 'Revocada',
    };
  }
}

