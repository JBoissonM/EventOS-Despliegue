import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AlcanceEvento, EstadoBoleto, EstadoSubEvento } from '@eventos/shared';
import { StorageService } from '../../common/storage/storage.service';

@Injectable()
export class LogisticaService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly storageService: StorageService,
  ) {}

  private resolverPosterUrl(poster?: string | null): string | null {
    if (!poster) return null;
    return poster.startsWith('http://') || poster.startsWith('https://')
      ? poster
      : this.storageService.publicUrl(poster);
  }

  /**
   * Verifica que el usuario esté asignado como Personal de Logística en ese evento
   */
  async validarAccesoLogistica(usuarioId: number, eventoId: number) {
    const asignacion = await this.dataSource.query(
      `SELECT 1
       FROM "eventoPersonalLogistica"
       WHERE "idUsuario" = $1 AND "idEvento" = $2
       LIMIT 1`,
      [usuarioId, eventoId],
    );

    const tienePermiso = asignacion.length > 0;

    if (!tienePermiso) {
      throw new ForbiddenException(
        'Acceso denegado (HTTP 403). No cuentas con permisos de Personal de Logística para este evento específico.',
      );
    }

    return { autorizado: true };
  }

  /**
   * Mis Eventos Asignados (Logística)
   * Devuelve las tarjetas de los subeventos asignados al personal de logística y datos para los filtros
   */
  async obtenerMisEventosAsignados(usuarioId: number) {
    const mapaAlcance: Record<number, string> = {
      [AlcanceEvento.PUBLICO]: 'Público',
      [AlcanceEvento.INTERNO]: 'Interno',
      [AlcanceEvento.PRIVADO]: 'Privado',
    };

    const filas = await this.dataSource.query(
      `SELECT 
         se."idSubEvento",
         se.nombre AS "nombreSubEvento",
         se.descripcion AS "descripcionSubEvento",
         se."accesoQR",
         se.estado AS "estadoSubEvento",
         e."idEvento",
         e.nombre AS "nombreEvento",
         e.poster,
         e."idAlcance",
         f.fecha,
         f."horaInicio",
         f."horaFin",
         r."idRecinto",
         r.nombre AS "espacio",
         r.aforo AS "aforoMaximo"
       FROM "eventoPersonalLogistica" epl
       INNER JOIN evento e ON epl."idEvento" = e."idEvento"
       INNER JOIN "subEvento" se ON e."idEvento" = se."idEvento"
       INNER JOIN fecha f ON se."idFecha" = f."idFecha"
       INNER JOIN recinto r ON se."idRecinto" = r."idRecinto"
       WHERE epl."idUsuario" = $1
         AND se.estado = $2
       ORDER BY f.fecha ASC, f."horaInicio" ASC`,
      [usuarioId, EstadoSubEvento.ACEPTADO],
    );

    const tarjetas = [];

    for (const fila of filas) {
      const ponentesRaw = await this.dataSource.query(
        `SELECT "idPonente", nombre, "apellidoPa", "apellidoMa", correo
         FROM ponente
         WHERE "idSubEvento" = $1`,
        [fila.idSubEvento],
      );

      const ponentes = ponentesRaw.map((p: any) => ({
        idPonente: p.idPonente,
        nombreCompleto: `${p.nombre} ${p.apellidoPa}${p.apellidoMa ? ' ' + p.apellidoMa : ''}`.trim(),
        correo: p.correo,
      }));

      tarjetas.push({
        idEvento: fila.idEvento,
        idSubEvento: fila.idSubEvento,
        nombreEvento: fila.nombreEvento,
        nombreSubEvento: fila.nombreSubEvento,
        descripcion: fila.descripcionSubEvento,
        poster: this.resolverPosterUrl(fila.poster),
        posterUrl: this.resolverPosterUrl(fila.poster),
        idAlcance: fila.idAlcance,
        alcance: mapaAlcance[fila.idAlcance] ?? 'Público',
        fecha: fila.fecha,
        horaInicio: fila.horaInicio,
        horaFin: fila.horaFin,
        horarioTexto: `${String(fila.horaInicio).slice(0, 5)}-${String(fila.horaFin).slice(0, 5)} hrs`,
        idRecinto: fila.idRecinto,
        espacio: fila.espacio,
        aforoMaximo: fila.aforoMaximo,
        accesoQR: fila.accesoQR,
        ponentes,
      });
    }

    return tarjetas;
  }

  /**
   * Determina la ocupación legible del asistente para la tabla de Control de Acceso
   */
  private resolverOcupacion(filaUsuario: any): string {
    if (filaUsuario.tipoCuenta === 'Subdirección' || filaUsuario.esJefeAcademia) {
      return 'Director';
    }
    if (filaUsuario.idRol === 2) {
      return 'Profesor';
    }
    if (filaUsuario.idRol === 1) {
      return 'Estudiante';
    }
    if (filaUsuario.idRol === 3 || filaUsuario.tipoCuenta === 'Usuario Externo') {
      return 'Externo';
    }
    return filaUsuario.tipoCuenta || 'Estudiante';
  }

  /**
   * Control de Acceso de un SubEvento
   * Devuelve el Aforo Actual (ej. 15/50) y la Lista de Asistentes (Nombre y Ocupación)
   */
  async obtenerControlAccesoSubEvento(usuarioId: number, idSubEvento: number) {
    //  Obtener datos del subevento, evento y recinto
    const subEventos = await this.dataSource.query(
      `SELECT 
         se."idSubEvento",
         se.nombre AS "nombreSubEvento",
         se."accesoQR",
         se."idEvento",
         e.nombre AS "nombreEvento",
         r."idRecinto",
         r.nombre AS "espacio",
         r.aforo AS "aforoMaximo",
         f.fecha,
         f."horaInicio",
         f."horaFin"
       FROM "subEvento" se
       INNER JOIN evento e ON se."idEvento" = e."idEvento"
       INNER JOIN recinto r ON se."idRecinto" = r."idRecinto"
       INNER JOIN fecha f ON se."idFecha" = f."idFecha"
       WHERE se."idSubEvento" = $1
       LIMIT 1`,
      [idSubEvento],
    );

    if (subEventos.length === 0) {
      throw new NotFoundException('El subevento especificado no existe.');
    }

    const info = subEventos[0];

    // Validar que el usuario logueado sea personal de logística de este evento
    await this.validarAccesoLogistica(usuarioId, info.idEvento);

    // Consultar los asistentes con boleto en este subevento 
    const asistentesRaw = await this.dataSource.query(
      `SELECT 
         b."idBoleto",
         b."idEstadoBoleto",
         b."fechaGeneracion",
         u."idUsuario",
         u.nombre,
         u."apellidoPa",
         u."apellidoMa",
         u.correo,
         u."tipoCuenta",
         u."esJefeAcademia",
         a.fila AS "filaAsiento",
         a.numero AS "numeroAsiento",
         v."idRol"
       FROM "asistenteEvento" ae
       INNER JOIN boleto b ON ae."idBoleto" = b."idBoleto"
       INNER JOIN usuario u ON ae."idUsuario" = u."idUsuario"
       LEFT JOIN asiento a ON b."idAsiento" = a."idAsiento"
       LEFT JOIN LATERAL (
         SELECT ver."idRol"
         FROM verificacion ver
         WHERE ver."idUsuario" = u."idUsuario"
         ORDER BY ver.fecha DESC
         LIMIT 1
       ) v ON true
       WHERE ae."idSubEvento" = $1
         AND b."idEstadoBoleto" IN ($2, $3)
       ORDER BY b."idEstadoBoleto" DESC, u."apellidoPa" ASC`,
      [idSubEvento, EstadoBoleto.UTILIZADO, EstadoBoleto.VALIDO],
    );

    // Asistentes que ya entraron
    const asistentesIngresados = [];
    // Todos los que tienen reserva activa bos
    const todosLosReservados = [];

    for (const row of asistentesRaw) {
      const nombreCompleto = `${row.nombre} ${row.apellidoPa}${row.apellidoMa ? ' ' + row.apellidoMa : ''}`.trim();
      const ocupacion = this.resolverOcupacion(row);
      const item = {
        idBoleto: row.idBoleto,
        idUsuario: row.idUsuario,
        nombre: nombreCompleto,
        ocupacion,
        correo: row.correo,
        idEstadoBoleto: row.idEstadoBoleto,
        ingresado: row.idEstadoBoleto === EstadoBoleto.UTILIZADO,
        asiento: row.filaAsiento ? `Fila ${row.filaAsiento}, Asiento ${row.numeroAsiento}` : 'Entrada General',
      };

      todosLosReservados.push(item);
      if (row.idEstadoBoleto === EstadoBoleto.UTILIZADO) {
        asistentesIngresados.push(item);
      }
    }

    const aforoActual = asistentesIngresados.length;
    const aforoMaximo = Number(info.aforoMaximo);

    return {
      idEvento: info.idEvento,
      idSubEvento: info.idSubEvento,
      nombreEvento: info.nombreEvento,
      nombreSubEvento: info.nombreSubEvento,
      espacio: info.espacio,
      fecha: info.fecha,
      horaInicio: info.horaInicio,
      horaFin: info.horaFin,
      aforoActual,
      aforoMaximo,
      aforoTexto: `${aforoActual}/${aforoMaximo}`,
      totalReservados: todosLosReservados.length,
      listaAsistentes: asistentesIngresados, // Los que ya pasaron por el escáner en puerta
      listaReservados: todosLosReservados,   // Lista completa (Válidos + Utilizados)
    };
  }

  /**
   * Acción del botón "Abrir Escáner": Valida el token QR o idBoleto y marca la entrada (EstadoBoleto.UTILIZADO)
   */
  async registrarEntradaPorQr(
    usuarioLogisticaId: number,
    idSubEvento: number,
    payload: { tokenQr?: string; idBoleto?: number },
  ) {
    if (!payload.tokenQr && !payload.idBoleto) {
      throw new BadRequestException('Debes enviar el tokenQr escaneado o el idBoleto.');
    }

    // Buscar el boleto y verificar que pertenezca al subevento
    const condicionSql = payload.tokenQr
      ? `b."tokenQR" = $2`
      : `b."idBoleto" = $2`;
    const valorBusqueda = payload.tokenQr ?? payload.idBoleto;

    const registros = await this.dataSource.query(
      `SELECT 
         b."idBoleto",
         b."idEstadoBoleto",
         ae."idSubEvento",
         ae."idUsuario",
         se."idEvento",
         u.nombre,
         u."apellidoPa",
         u."apellidoMa",
         u."tipoCuenta",
         u."esJefeAcademia"
       FROM boleto b
       INNER JOIN "asistenteEvento" ae ON b."idBoleto" = ae."idBoleto"
       INNER JOIN "subEvento" se ON ae."idSubEvento" = se."idSubEvento"
       INNER JOIN usuario u ON ae."idUsuario" = u."idUsuario"
       WHERE ae."idSubEvento" = $1 AND ${condicionSql}
       LIMIT 1`,
      [idSubEvento, valorBusqueda],
    );

    if (registros.length === 0) {
      throw new NotFoundException(
        'El boleto escaneado no existe o no pertenece a esta actividad.',
      );
    }

    const registro = registros[0];

    // Validar que el usuario de logística tenga permiso sobre este evento
    await this.validarAccesoLogistica(usuarioLogisticaId, registro.idEvento);

    // Revisar estado del boleto
    if (registro.idEstadoBoleto === EstadoBoleto.UTILIZADO) {
      throw new ConflictException('Este boleto ya fue utilizado anteriormente para ingresar.');
    }

    if (registro.idEstadoBoleto === EstadoBoleto.CANCELADO) {
      throw new ConflictException('Este boleto se encuentra cancelado y no permite el acceso.');
    }

    // Cambiar estado a UTILIZADO (2)
    await this.dataSource.query(
      `UPDATE boleto SET "idEstadoBoleto" = $1 WHERE "idBoleto" = $2`,
      [EstadoBoleto.UTILIZADO, registro.idBoleto],
    );

    // Devolver el estado actualizado del Control de Acceso para refrescar la pantalla al instante
    const controlActualizado = await this.obtenerControlAccesoSubEvento(
      usuarioLogisticaId,
      idSubEvento,
    );

    return {
      mensaje: 'Acceso registrado exitosamente.',
      asistenteRecienIngresado: {
        idBoleto: registro.idBoleto,
        nombre: `${registro.nombre} ${registro.apellidoPa}${registro.apellidoMa ? ' ' + registro.apellidoMa : ''}`.trim(),
        ocupacion: this.resolverOcupacion(registro),
      },
      controlAcceso: controlActualizado,
    };
  }
}