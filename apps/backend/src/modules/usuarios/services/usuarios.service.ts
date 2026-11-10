import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { UsuarioEntity } from '../../auth/entities/usuario.entity';
import { VerificacionEntity } from '../../auth/entities/verificacion.entity';
import { RolEntity } from '../entities/rol.entity';
import { MailService } from '../../reservas/services/mail.service';
import {
  EstadoVerificacion,
  TipoCuentaUsuario,
  TipoPerfilVerificacion,
  PerfilUsuarioResponse,
  SolicitudVerificacionItem,
  CuentaSistemaItem,
  JefeDepartamentoItem,
} from '@eventos/shared';

@Injectable()
export class UsuariosService {
  // Regex unificada de Boleta para Estudiantes y Profesores
  private readonly BOLETA_REGEX = /^(?:\d{4,10}|P[EP]\d{8})$/;

  private readonly mapaRoles: Record<number, string> = {
    1: TipoPerfilVerificacion.ESTUDIANTE,
    2: TipoPerfilVerificacion.PROFESOR,
    3: TipoPerfilVerificacion.DOCENTE,
    4: TipoPerfilVerificacion.EMPRESA,
    5: TipoPerfilVerificacion.EXTERNO,
  };

  constructor(
    @InjectRepository(UsuarioEntity)
    private readonly usuarioRepository: Repository<UsuarioEntity>,
    @InjectRepository(VerificacionEntity)
    private readonly verificacionRepository: Repository<VerificacionEntity>,
    @InjectRepository(RolEntity)
    private readonly rolRepository: Repository<RolEntity>,
    private readonly dataSource: DataSource,
    private readonly mailService: MailService,
  ) {}

  // Consulta el Perfil y evalúa caducidad de 3 meses (90 días) o si está Pendiente de Subdirección
  async obtenerPerfil(idUsuario: number): Promise<PerfilUsuarioResponse> {
    const usuario = await this.usuarioRepository.findOne({
      where: { idUsuario },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const ultimaVerificacion = await this.verificacionRepository.findOne({
      where: { idUsuario },
      order: { fecha: 'DESC', idVerificacion: 'DESC' },
    });

    let tipoUsuario = 'Externo';
    if (ultimaVerificacion && ultimaVerificacion.idRol) {
      tipoUsuario = this.mapaRoles[ultimaVerificacion.idRol] ?? 'Externo';
    }

    let verificacionVigente = false;
    let solicitudPendiente = false;
    let estadoSolicitud: 'Sin solicitud' | 'Pendiente' | 'Verificado' =
      'Sin solicitud';
    let fechaVerificacion: Date | null = null;
    let cuentaEstado = usuario.esVerificado;

    if (ultimaVerificacion && ultimaVerificacion.fecha) {
      fechaVerificacion = new Date(ultimaVerificacion.fecha);
      const hoy = new Date();
      const milisegundosEnTresMeses = 1000 * 60 * 60 * 24 * 90;
      const diferencia = hoy.getTime() - fechaVerificacion.getTime();

      if (diferencia > milisegundosEnTresMeses) {
        // Caducó la verificación después de 3 meses
        cuentaEstado = EstadoVerificacion.NO_VERIFICADO;
        verificacionVigente = false;
        solicitudPendiente = false;
        estadoSolicitud = 'Sin solicitud';

        if (usuario.esVerificado === EstadoVerificacion.VERIFICADO) {
          usuario.esVerificado = EstadoVerificacion.NO_VERIFICADO;
          await this.usuarioRepository.save(usuario);
        }
      } else if (usuario.esVerificado === EstadoVerificacion.VERIFICADO) {
        // Ya fue aprobada por Subdirección y sigue dentro de los 3 meses
        verificacionVigente = true;
        solicitudPendiente = false;
        estadoSolicitud = 'Verificado';
      } else {
        // Subió solicitud hace menos de 3 meses pero Subdirección aún no la aprueba
        verificacionVigente = false;
        solicitudPendiente = true;
        estadoSolicitud = 'Pendiente';
      }
    }

    return {
      idUsuario: usuario.idUsuario,
      nombreCompleto: `${usuario.nombre} ${usuario.apellidoPa} ${usuario.apellidoMa || ''}`.trim(),
      correo: usuario.correo,
      tipoCuenta: usuario.tipoCuenta,
      cuenta: cuentaEstado,
      tipoUsuario,
      fechaUltimaVerificacion: fechaVerificacion,
      verificacionVigente,
      solicitudPendiente,
      estadoSolicitud,
    };
  }

  // Subir solicitud de verificación (queda Pendiente hasta que Subdirección la apruebe y bloquea duplicadas)
  async verificarCuenta(
    idUsuario: number,
    tipoPerfil: TipoPerfilVerificacion,
    informacionAdicional: string | null,
    archivoPath: string,
  ) {
    if (!archivoPath) {
      throw new BadRequestException('El documento PDF es obligatorio');
    }

    const usuario = await this.usuarioRepository.findOne({
      where: { idUsuario },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Verificar si ya tiene una solicitud pendiente o una verificación vigente (< 90 días)
    const ultimaVerificacion = await this.verificacionRepository.findOne({
      where: { idUsuario },
      order: { fecha: 'DESC', idVerificacion: 'DESC' },
    });

    if (ultimaVerificacion && ultimaVerificacion.fecha) {
      const fechaUltima = new Date(ultimaVerificacion.fecha);
      const hoy = new Date();
      const milisegundosEnTresMeses = 1000 * 60 * 60 * 24 * 90;
      const diferencia = hoy.getTime() - fechaUltima.getTime();

      if (diferencia <= milisegundosEnTresMeses) {
        if (usuario.esVerificado === EstadoVerificacion.VERIFICADO) {
          const diasRestantes = Math.ceil(
            (milisegundosEnTresMeses - diferencia) / (1000 * 60 * 60 * 24),
          );
          throw new ConflictException(
            `Ya cuentas con una verificación vigente. Solo puedes realizar una solicitud cada 3 meses (faltan ${diasRestantes} días).`,
          );
        } else {
          throw new ConflictException(
            'Ya tienes una solicitud de verificación pendiente de aprobación por Subdirección.',
          );
        }
      }
    }

    const infoLimpia = informacionAdicional ? informacionAdicional.trim() : '';

    // Validar Boleta obligatoria para Estudiante, Profesor y Docente
    if (
      tipoPerfil === TipoPerfilVerificacion.ESTUDIANTE ||
      tipoPerfil === TipoPerfilVerificacion.PROFESOR ||
      tipoPerfil === TipoPerfilVerificacion.DOCENTE
    ) {
      if (!infoLimpia || !this.BOLETA_REGEX.test(infoLimpia)) {
        throw new BadRequestException(
          'La boleta es obligatoria para estudiantes y profesores y debe contener únicamente dígitos válidos.',
        );
      }
    }

    if (tipoPerfil === TipoPerfilVerificacion.EMPRESA && !infoLimpia) {
      throw new BadRequestException(
        'El nombre de la empresa es obligatorio para este perfil.',
      );
    }

    let idRolAsignar = 0;
    switch (tipoPerfil) {
      case TipoPerfilVerificacion.ESTUDIANTE:
        idRolAsignar = 1;
        break;
      case TipoPerfilVerificacion.PROFESOR:
        idRolAsignar = 2;
        break;
      case TipoPerfilVerificacion.DOCENTE:
        idRolAsignar = 3;
        break;
      case TipoPerfilVerificacion.EMPRESA:
        idRolAsignar = 4;
        break;
      case TipoPerfilVerificacion.EXTERNO:
        idRolAsignar = 5;
        break;
      default:
        throw new BadRequestException('Tipo de perfil no válido');
    }

    return await this.dataSource.transaction(async (manager) => {
      const nuevaVerificacion = manager.create(VerificacionEntity, {
        informacionAdicional: infoLimpia,
        archivo: archivoPath,
        idRol: idRolAsignar,
        idUsuario: idUsuario,
      });

      await manager.save(nuevaVerificacion);

      // Se mantiene en NO_VERIFICADO hasta que Subdirección apruebe la solicitud
      usuario.esVerificado = EstadoVerificacion.NO_VERIFICADO;
      await manager.save(usuario);

      return {
        mensaje:
          'Solicitud de verificación enviada correctamente. Pendiente de aprobación por Subdirección.',
        estadoSolicitud: 'Pendiente',
        verificacion: nuevaVerificacion,
      };
    });
  }

  //Listar solicitudes de verificación y filtrar por rol o nombre del solicitante
  async listarSolicitudesVerificacion(
    soloPendientes = true,
    buscar?: string,
  ): Promise<SolicitudVerificacionItem[]> {
    const verificaciones = await this.verificacionRepository.find({
      order: { fecha: 'DESC', idVerificacion: 'DESC' },
    });

    const usuarios = await this.usuarioRepository.find({
      where: { estatus: true },
    });
    const mapaUsuarios = new Map<number, UsuarioEntity>();
    for (const u of usuarios) {
      mapaUsuarios.set(u.idUsuario, u);
    }

    // Tomar la última solicitud de cada usuario activo
    const ultimaPorUsuario = new Map<number, VerificacionEntity>();
    for (const v of verificaciones) {
      if (!ultimaPorUsuario.has(v.idUsuario) && mapaUsuarios.has(v.idUsuario)) {
        ultimaPorUsuario.set(v.idUsuario, v);
      }
    }

    let resultado: SolicitudVerificacionItem[] = [];
    const hoy = new Date();
    const milisegundosEnTresMeses = 1000 * 60 * 60 * 24 * 90;

    for (const [idUsuario, verif] of ultimaPorUsuario.entries()) {
      const u = mapaUsuarios.get(idUsuario)!;
      const fechaSol = new Date(verif.fecha);
      const vigenteEnTiempo =
        hoy.getTime() - fechaSol.getTime() <= milisegundosEnTresMeses;

      if (!vigenteEnTiempo) continue;

      const estaPendiente =
        u.esVerificado === EstadoVerificacion.NO_VERIFICADO;

      if (soloPendientes && !estaPendiente) continue;

      resultado.push({
        idVerificacion: verif.idVerificacion,
        idUsuario: u.idUsuario,
        estado: estaPendiente ? 'Pendiente' : 'Verificado',
        fechaSolicitud: verif.fecha,
        perfilSolicita: this.mapaRoles[verif.idRol] ?? 'Externo',
        nombre: `${u.apellidoPa} ${u.apellidoMa || ''} ${u.nombre}`.trim(),
        correo: u.correo,
        numeroBoleta: verif.informacionAdicional || null,
        informacionAdicional: verif.informacionAdicional || null,
        archivo: verif.archivo,
      });
    }

    if (buscar && buscar.trim() !== '') {
      const termino = buscar.trim().toLowerCase();
      resultado = resultado.filter((item) => {
        const rolMin = item.perfilSolicita.toLowerCase();
        const coincideDocenteProfesor =
          (termino === 'docente' || termino === 'profesor') &&
          (rolMin === 'docente' || rolMin === 'profesor');

        return (
          coincideDocenteProfesor ||
          item.nombre.toLowerCase().includes(termino) ||
          rolMin.includes(termino) ||
          item.correo.toLowerCase().includes(termino) ||
          (item.numeroBoleta &&
            item.numeroBoleta.toLowerCase().includes(termino))
        );
      });
    }

    return resultado;
  }

  // SUBDIRECCIÓN: Obtener detalle de una solicitud de verificación por idVerificacion o idUsuario
  async obtenerDetalleVerificacion(
    id: number,
  ): Promise<SolicitudVerificacionItem> {
    let verif = await this.verificacionRepository.findOne({
      where: { idVerificacion: id },
    });

    if (!verif) {
      verif = await this.verificacionRepository.findOne({
        where: { idUsuario: id },
        order: { fecha: 'DESC', idVerificacion: 'DESC' },
      });
    }

    if (!verif) {
      throw new NotFoundException(
        'Solicitud de verificación no encontrada.',
      );
    }

    const u = await this.usuarioRepository.findOne({
      where: { idUsuario: verif.idUsuario },
    });

    if (!u) {
      throw new NotFoundException('Usuario solicitante no encontrado.');
    }

    return {
      idVerificacion: verif.idVerificacion,
      idUsuario: u.idUsuario,
      estado:
        u.esVerificado === EstadoVerificacion.VERIFICADO
          ? 'Verificado'
          : 'Pendiente',
      fechaSolicitud: verif.fecha,
      perfilSolicita: this.mapaRoles[verif.idRol] ?? 'Externo',
      nombre: `${u.apellidoPa} ${u.apellidoMa || ''} ${u.nombre}`.trim(),
      correo: u.correo,
      numeroBoleta: verif.informacionAdicional || null,
      informacionAdicional: verif.informacionAdicional || null,
      archivo: verif.archivo,
    };
  }

  // SUBDIRECCIÓN: Botón verde [Verificar usuario] Aprueba la verificación y marca Verificado por 3 meses
  async aprobarVerificacionUsuario(id: number) {
    let verif = await this.verificacionRepository.findOne({
      where: { idVerificacion: id },
    });

    if (!verif) {
      verif = await this.verificacionRepository.findOne({
        where: { idUsuario: id },
        order: { fecha: 'DESC', idVerificacion: 'DESC' },
      });
    }

    if (!verif) {
      throw new NotFoundException(
        'No se encontró la solicitud de verificación.',
      );
    }

    const usuario = await this.usuarioRepository.findOne({
      where: { idUsuario: verif.idUsuario, estatus: true },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado o inactivo.');
    }

    usuario.esVerificado = EstadoVerificacion.VERIFICADO;
    await this.usuarioRepository.save(usuario);

    const nombreUsuario =
      `${usuario.nombre} ${usuario.apellidoPa} ${usuario.apellidoMa || ''}`.trim();
    const perfilVerificado = this.mapaRoles[verif.idRol] ?? 'Externo';

    await this.mailService.enviarCorreoVerificacionAprobada({
      destinatario: usuario.correo,
      nombreUsuario,
      perfilVerificado,
    });

    return {
      mensaje: 'Usuario verificado con éxito por Subdirección.',
      idVerificacion: verif.idVerificacion,
      idUsuario: usuario.idUsuario,
      esVerificado: usuario.esVerificado,
      estado: 'Verificado',
    };
  }

  // SUBDIRECCIÓN: Botón [Rechazar] Rechaza la solicitud, envía correo con el motivo y permite al usuario enviar una nueva
  async rechazarVerificacionUsuario(
    id: number,
    datosRechazo?: {
      motivo?: string;
      motivoRechazo?: string;
      detalle?: string | null;
      observaciones?: string | null;
    },
  ) {
    const motivoBase = (
      datosRechazo?.motivo ??
      datosRechazo?.motivoRechazo ??
      ''
    ).trim();
    const detalleExtra = (
      datosRechazo?.detalle ??
      datosRechazo?.observaciones ??
      ''
    ).trim();

    if (!motivoBase) {
      throw new BadRequestException(
        'Debes seleccionar o indicar el motivo por el cual se rechaza la verificación de la cuenta.',
      );
    }

    const esOtroMotivo = motivoBase.toLowerCase() === 'otro motivo';
    if (esOtroMotivo && !detalleExtra) {
      throw new BadRequestException(
        'Debes escribir el detalle u observaciones adicionales cuando seleccionas Otro motivo.',
      );
    }

    const motivoFinal = esOtroMotivo
      ? `Otro motivo: ${detalleExtra}`
      : detalleExtra
        ? `${motivoBase}. ${detalleExtra}`
        : motivoBase;

    let verif = await this.verificacionRepository.findOne({
      where: { idVerificacion: id },
    });

    if (!verif) {
      verif = await this.verificacionRepository.findOne({
        where: { idUsuario: id },
        order: { fecha: 'DESC', idVerificacion: 'DESC' },
      });
    }

    if (!verif) {
      throw new NotFoundException(
        'No se encontró la solicitud de verificación.',
      );
    }

    const usuario = await this.usuarioRepository.findOne({
      where: { idUsuario: verif.idUsuario },
    });

    if (usuario) {
      usuario.esVerificado = EstadoVerificacion.NO_VERIFICADO;
      await this.usuarioRepository.save(usuario);
    }

    // Eliminamos todas las solicitudes pendientes de ese usuario para que pueda volver a subir su documento corregido
    await this.verificacionRepository.delete({ idUsuario: verif.idUsuario });

    if (usuario) {
      const nombreUsuario =
        `${usuario.nombre} ${usuario.apellidoPa} ${usuario.apellidoMa || ''}`.trim();
      const perfilSolicitado = this.mapaRoles[verif.idRol] ?? 'Externo';

      await this.mailService.enviarCorreoVerificacionRechazada({
        destinatario: usuario.correo,
        nombreUsuario,
        perfilSolicitado,
        motivoRechazo: motivoFinal,
      });
    }

    return {
      mensaje: 'Solicitud de verificación rechazada.',
      idVerificacion: verif.idVerificacion,
      idUsuario: verif.idUsuario,
      esVerificado: EstadoVerificacion.NO_VERIFICADO,
      estado: 'Rechazado',
      motivoRechazo: motivoFinal,
    };
  }

  // ADMINISTRADOR: Listar Cuentas del sistema (activas e inactivas) y filtrar por criterio
  async listarCuentasSistema(filtros?: {
    criterio?: string;
    buscar?: string;
    nombre?: string;
    correo?: string;
    rol?: string;
    estado?: string;
  }): Promise<CuentaSistemaItem[]> {
    const usuarios = await this.usuarioRepository.find({
      order: { idUsuario: 'ASC' },
    });

    const verificaciones = await this.verificacionRepository.find({
      order: { fecha: 'DESC', idVerificacion: 'DESC' },
    });

    const ultimaVerifPorUsuario = new Map<number, VerificacionEntity>();
    for (const v of verificaciones) {
      if (!ultimaVerifPorUsuario.has(v.idUsuario)) {
        ultimaVerifPorUsuario.set(v.idUsuario, v);
      }
    }

    let cuentas: CuentaSistemaItem[] = usuarios.map((u) => {
      const verif = ultimaVerifPorUsuario.get(u.idUsuario);
      let rolMostrar =
        u.tipoCuenta === TipoCuentaUsuario.EXTERNO ? 'Externo' : 'No verificado';

      if (u.esVerificado === EstadoVerificacion.VERIFICADO && verif) {
        rolMostrar = this.mapaRoles[verif.idRol] ?? 'Externo';
      } else if (u.tipoCuenta === TipoCuentaUsuario.ADMINISTRADOR) {
        rolMostrar = 'Administrador';
      } else if (u.tipoCuenta === TipoCuentaUsuario.SUBDIRECCION) {
        rolMostrar = 'Subdirección';
      }

      return {
        idUsuario: u.idUsuario,
        nombre: `${u.nombre} ${u.apellidoPa} ${u.apellidoMa || ''}`.trim(),
        correo: u.correo,
        estado: u.estatus ? 'Activo' : 'Inactivo',
        esVerificado: u.esVerificado,
        rol: rolMostrar,
        tipoCuenta: u.tipoCuenta,
        estatus: u.estatus,
      };
    });

    const criterioGeneral = (filtros?.criterio || filtros?.buscar || '')
      .trim()
      .toLowerCase();

    if (criterioGeneral && criterioGeneral !== 'todos') {
      cuentas = cuentas.filter((c) => {
        const rolMin = c.rol.toLowerCase();
        if (criterioGeneral === 'docente' || criterioGeneral === 'profesor') {
          return rolMin === 'docente' || rolMin === 'profesor';
        }
        if (
          criterioGeneral === 'no verificado' ||
          criterioGeneral === 'sin verificar'
        ) {
          return c.esVerificado === EstadoVerificacion.NO_VERIFICADO;
        }
        if (criterioGeneral === 'activo' || criterioGeneral === 'habilitado') {
          return c.estatus === true;
        }
        if (
          criterioGeneral === 'inactivo' ||
          criterioGeneral === 'deshabilitado' ||
          criterioGeneral === 'inhabilitado'
        ) {
          return c.estatus === false;
        }
        return (
          c.nombre.toLowerCase().includes(criterioGeneral) ||
          c.correo.toLowerCase().includes(criterioGeneral) ||
          rolMin.includes(criterioGeneral) ||
          c.estado.toLowerCase() === criterioGeneral
        );
      });
    }

    const terminoNombre = (filtros?.nombre || '').trim().toLowerCase();
    if (terminoNombre) {
      cuentas = cuentas.filter((c) =>
        c.nombre.toLowerCase().includes(terminoNombre),
      );
    }

    const terminoCorreo = (filtros?.correo || '').trim().toLowerCase();
    if (terminoCorreo) {
      cuentas = cuentas.filter((c) =>
        c.correo.toLowerCase().includes(terminoCorreo),
      );
    }

    const terminoRol = (filtros?.rol || '').trim().toLowerCase();
    if (terminoRol && terminoRol !== 'todos') {
      cuentas = cuentas.filter((c) => {
        const rolCuenta = c.rol.toLowerCase();
        if (terminoRol === 'docente' || terminoRol === 'profesor') {
          return rolCuenta === 'docente' || rolCuenta === 'profesor';
        }
        if (terminoRol === 'no verificado' || terminoRol === 'sin verificar') {
          return c.esVerificado === EstadoVerificacion.NO_VERIFICADO;
        }
        return rolCuenta === terminoRol;
      });
    }

    const terminoEstado = (filtros?.estado || '').trim().toLowerCase();
    if (terminoEstado && terminoEstado !== 'todos') {
      cuentas = cuentas.filter((c) => {
        if (terminoEstado === 'activo' || terminoEstado === 'habilitado') {
          return c.estatus === true;
        }
        if (
          terminoEstado === 'inactivo' ||
          terminoEstado === 'deshabilitado' ||
          terminoEstado === 'inhabilitado'
        ) {
          return c.estatus === false;
        }
        return c.estado.toLowerCase() === terminoEstado;
      });
    }

    return cuentas;
  }

  // ADMINISTRADOR: Habilitar o deshabilitar cuenta de usuario
  async cambiarEstatusCuenta(
    idUsuarioObjetivo: number,
    idAdminActor: number,
    nuevoEstatus?: boolean,
  ) {
    const usuario = await this.usuarioRepository.findOne({
      where: { idUsuario: idUsuarioObjetivo },
    });

    if (!usuario) {
      throw new NotFoundException('La cuenta de usuario no existe.');
    }

    const estatusObjetivo =
      typeof nuevoEstatus === 'boolean' ? nuevoEstatus : !usuario.estatus;

    if (!estatusObjetivo) {
      if (usuario.idUsuario === idAdminActor) {
        throw new ConflictException(
          'No puedes deshabilitar tu propia cuenta de Administrador activa.',
        );
      }

      if (usuario.tipoCuenta === TipoCuentaUsuario.ADMINISTRADOR) {
        const adminsActivos = await this.usuarioRepository.count({
          where: {
            tipoCuenta: TipoCuentaUsuario.ADMINISTRADOR,
            estatus: true,
          },
        });

        if (adminsActivos <= 1 && usuario.estatus) {
          throw new ConflictException(
            'El sistema debe garantizar siempre la existencia de al menos una cuenta de Administrador activa.',
          );
        }
      }
    }

    usuario.estatus = estatusObjetivo;

    // Si se vuelve a habilitar la cuenta, se limpian bloqueos temporales previos
    if (estatusObjetivo) {
      usuario.intentosFallidos = 0;
      usuario.bloqueadoHasta = null;
    }

    await this.usuarioRepository.save(usuario);

    return {
      mensaje: usuario.estatus
        ? 'La cuenta de usuario ha sido habilitada con éxito.'
        : 'La cuenta de usuario ha sido deshabilitada con éxito.',
      idUsuario: usuario.idUsuario,
      estado: usuario.estatus ? 'Activo' : 'Inactivo',
      estatus: usuario.estatus,
    };
  }

  // Listar usuarios para Tab 1 (Asignar Jefe -> esJefe = false) y Tab 2 (Revocar Jefe -> esJefe = true)
  async listarCandidatosOJefes(
    esJefe: boolean,
    buscar?: string,
    idAdminActor?: number,
  ): Promise<JefeDepartamentoItem[]> {
    const usuarios = await this.usuarioRepository.find({
      where: {
        estatus: true,
        esJefeAcademia: esJefe,
      },
      order: { idUsuario: 'ASC' },
    });

    const usuariosInstitucionales = usuarios.filter((u) => {
      const tipoNormalizado = (u.tipoCuenta || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

      // Excluir cuentas de Subdirección y Administrador (y al propio Admin en sesión)
      if (
        u.tipoCuenta === TipoCuentaUsuario.SUBDIRECCION ||
        u.tipoCuenta === TipoCuentaUsuario.ADMINISTRADOR ||
        tipoNormalizado === 'subdireccion' ||
        tipoNormalizado === 'administrador' ||
        (idAdminActor && u.idUsuario === idAdminActor)
      ) {
        return false;
      }

      const correoMin = u.correo.toLowerCase();
      return (
        u.tipoCuenta === TipoCuentaUsuario.INTERNO ||
        correoMin.endsWith('@ipn.mx') ||
        correoMin.endsWith('@alumno.ipn.mx')
      );
    });

    const verificaciones = await this.verificacionRepository.find({
      order: { fecha: 'DESC', idVerificacion: 'DESC' },
    });

    const boletaPorUsuario = new Map<number, string>();
    for (const v of verificaciones) {
      if (!boletaPorUsuario.has(v.idUsuario) && v.informacionAdicional) {
        boletaPorUsuario.set(v.idUsuario, v.informacionAdicional);
      }
    }

    let lista: JefeDepartamentoItem[] = usuariosInstitucionales.map((u) => ({
      idUsuario: u.idUsuario,
      boleta:
        boletaPorUsuario.get(u.idUsuario) ??
        String(u.idUsuario).padStart(4, '0'),
      nombre: `${u.nombre} ${u.apellidoPa} ${u.apellidoMa || ''}`.trim(),
      correoInstitucional: u.correo,
      esJefeAcademia: u.esJefeAcademia,
    }));

    if (buscar && buscar.trim() !== '') {
      const termino = buscar.trim().toLowerCase();
      lista = lista.filter(
        (item) =>
          item.nombre.toLowerCase().includes(termino) ||
          item.correoInstitucional.toLowerCase().includes(termino) ||
          item.boleta.toLowerCase().includes(termino),
      );
    }

    return lista;
  }

  // Tab 1 Acción del botón [Asignar Jefe]
  async asignarJefeDepartamento(idUsuario: number, idAdminActor?: number) {
    const usuario = await this.usuarioRepository.findOne({
      where: { idUsuario, estatus: true },
    });

    if (!usuario) {
      throw new NotFoundException(
        'La cuenta de usuario no existe o se encuentra inactiva.',
      );
    }

    const tipoNormalizado = (usuario.tipoCuenta || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    // La cuenta de Admin no puede asignarse como jefe desde la misma cuenta de Admin
    if (
      (idAdminActor && usuario.idUsuario === idAdminActor) ||
      usuario.tipoCuenta === TipoCuentaUsuario.ADMINISTRADOR ||
      tipoNormalizado === 'administrador'
    ) {
      throw new ConflictException(
        'La cuenta de Administrador no puede ser asignada como Jefe de Departamento.',
      );
    }

    // La cuenta de Subdirección no puede ser asignada como jefe de departamento
    if (
      usuario.tipoCuenta === TipoCuentaUsuario.SUBDIRECCION ||
      tipoNormalizado === 'subdireccion'
    ) {
      throw new ConflictException(
        'La cuenta de Subdirección no puede ser asignada como Jefe de Departamento.',
      );
    }

    if (usuario.esJefeAcademia) {
      throw new ConflictException(
        'El usuario ya cuenta con los permisos de Jefe de Departamento.',
      );
    }

    usuario.esJefeAcademia = true;
    await this.usuarioRepository.save(usuario);

    const nombreCompleto = `${usuario.nombre} ${usuario.apellidoPa} ${usuario.apellidoMa || ''}`.trim();

    return {
      mensaje: `${nombreCompleto} fue asignado como Jefe de Departamento`,
      idUsuario: usuario.idUsuario,
      nombre: nombreCompleto,
      correoInstitucional: usuario.correo,
      esJefeAcademia: true,
    };
  }

  // Tab 2 -> Acción del botón [Revocar]
  async revocarJefeDepartamento(idUsuario: number) {
    const usuario = await this.usuarioRepository.findOne({
      where: { idUsuario, estatus: true },
    });

    if (!usuario) {
      throw new NotFoundException(
        'La cuenta de usuario no existe o se encuentra inactiva.',
      );
    }

    if (!usuario.esJefeAcademia) {
      throw new ConflictException(
        'El usuario no tiene asignado el cargo de Jefe de Departamento.',
      );
    }

    usuario.esJefeAcademia = false;
    await this.usuarioRepository.save(usuario);

    const nombreCompleto = `${usuario.nombre} ${usuario.apellidoPa} ${usuario.apellidoMa || ''}`.trim();

    return {
      mensaje: `${nombreCompleto} fue revocado del cargo`,
      idUsuario: usuario.idUsuario,
      nombre: nombreCompleto,
      correoInstitucional: usuario.correo,
      esJefeAcademia: false,
    };
  }
}