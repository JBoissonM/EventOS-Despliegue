import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '../../auth/roles.guard';
import { OrganizadorService } from '../services/organizador.service';
import { ModificarLogisticaDto } from '../dto/modificarLogistica.dto';
import { ActualizarInfoGeneralDto } from '../dto/actualizarInfoGeneral.dto';
import { AgregarInvitadoDto } from '../dto/invitadoPrivado.dto';
import { AgregarInvitadosMasivoDto } from '../dto/agregarInvitadosMasivo.dto';
import { CancelarSolicitudDto } from '../dto/cancelarSolicitud.dto';
import { AgregarPersonalLogisticaDto } from '../dto/agregarPersonalLogistica.dto';
import { posterOptions } from '../../../common/upload/upload.options';

@ApiTags('Organizador')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('eventos')
export class OrganizadorController {
  constructor(private readonly organizadorService: OrganizadorService) {}

  private obtenerIdUsuarioAutenticado(req: any): number {
    const idUsuario = req.user?.sub ?? req.user?.idUsuario;
    if (!idUsuario) {
      throw new ForbiddenException(
        'No se pudo identificar al usuario en el token.',
      );
    }
    return Number(idUsuario);
  }

  private obtenerRolUsuarioAutenticado(req: any): string | undefined {
    return req.user?.tipoCuenta;
  }

  private validarFechasPosterioresAHoy(payload: any): void {
    if (!payload || typeof payload !== 'object') return;

    const fechaHoy = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Mexico_City',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());

    const fechasExtraidas: string[] = [];

    const recolectarFechas = (nodo: any) => {
      if (!nodo) return;
      if (typeof nodo === 'string') {
        try {
          recolectarFechas(JSON.parse(nodo));
        } catch {
          return;
        }
        return;
      }
      if (Array.isArray(nodo)) {
        for (const item of nodo) recolectarFechas(item);
        return;
      }
      if (typeof nodo === 'object') {
        for (const [clave, valor] of Object.entries(nodo)) {
          if (
            (clave === 'fecha' || clave === 'nuevaFecha' || clave === 'fechaEvento') &&
            typeof valor === 'string' &&
            /^\d{4}-\d{2}-\d{2}/.test(valor.trim())
          ) {
            fechasExtraidas.push(valor.trim().slice(0, 10));
          } else if (typeof valor === 'object' || typeof valor === 'string') {
            recolectarFechas(valor);
          }
        }
      }
    };

    recolectarFechas(payload);

    for (const fecha of fechasExtraidas) {
      if (fecha <= fechaHoy) {
        throw new BadRequestException(
          `No se permiten modificaciones ni reprogramaciones para el mismo día (${fechaHoy}) o fechas pasadas.`,
        );
      }
    }
  }

  @ApiOperation({
    summary: 'Consultar mis eventos registrados como organizador',
  })
  @Get('mis-eventos')
  async obtenerMisEventos(@Req() req: any) {
    const idUsuario = this.obtenerIdUsuarioAutenticado(req);
    return await this.organizadorService.obtenerMisEventos(idUsuario);
  }

  @ApiOperation({
    summary: 'Consultar detalle administrativo de un evento propio',
  })
  @Get(':idEvento/detalle-organizador')
  async obtenerDetalleOrganizador(
    @Param('idEvento', ParseIntPipe) idEvento: number,
    @Req() req: any,
  ) {
    const idUsuario = this.obtenerIdUsuarioAutenticado(req);
    const rolActor = this.obtenerRolUsuarioAutenticado(req);
    return await this.organizadorService.obtenerDetalleOrganizador(
      idEvento,
      idUsuario,
      rolActor,
    );
  }

  @ApiOperation({
    summary:
      'Solicitar o actualizar in-flight la modificación logística de un evento',
  })
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Patch(':idEvento/logistica')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async solicitarModificacionLogistica(
    @Param('idEvento', ParseIntPipe) idEvento: number,
    @Body() dto: ModificarLogisticaDto,
    @Req() req: any,
  ) {
    this.validarFechasPosterioresAHoy(dto);
    const idUsuario = this.obtenerIdUsuarioAutenticado(req);
    const rolActor = this.obtenerRolUsuarioAutenticado(req);
    return await this.organizadorService.solicitarModificacionLogistica(
      idEvento,
      idUsuario,
      dto,
      rolActor,
    );
  }

  @ApiOperation({
    summary:
      'Actualizar información general, alcance, póster y ponentes de un evento con aprobación automática',
  })
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Patch(':idEvento/info-general')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'file', maxCount: 1 },
        { name: 'poster', maxCount: 1 },
      ],
      posterOptions,
    ),
  )
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async actualizarInfoGeneral(
    @Param('idEvento', ParseIntPipe) idEvento: number,
    @Body() dto: ActualizarInfoGeneralDto,
    @UploadedFiles()
    files:
      | { file?: Express.Multer.File[]; poster?: Express.Multer.File[] }
      | undefined,
    @Req() req: any,
  ) {
    this.validarFechasPosterioresAHoy(dto);
    const idUsuario = this.obtenerIdUsuarioAutenticado(req);
    const rolActor = this.obtenerRolUsuarioAutenticado(req);
    const posterFile = files?.file?.[0] ?? files?.poster?.[0];
    return await this.organizadorService.actualizarInfoGeneral(
      idEvento,
      idUsuario,
      dto,
      posterFile,
      rolActor,
    );
  }

  @ApiOperation({
    summary:
      'Agregar invitados de forma masiva por lote a un subevento en un evento privado',
  })
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @Post(':idEvento/subeventos/:idSubEvento/invitados/masivo')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async agregarInvitadosMasivo(
    @Param('idEvento', ParseIntPipe) idEvento: number,
    @Param('idSubEvento', ParseIntPipe) idSubEvento: number,
    @Body() dto: AgregarInvitadosMasivoDto,
    @Req() req: any,
  ) {
    const idUsuario = this.obtenerIdUsuarioAutenticado(req);
    return await this.organizadorService.agregarInvitadosMasivo(
      idEvento,
      idSubEvento,
      idUsuario,
      dto,
    );
  }

  @ApiOperation({
    summary:
      'Agregar un invitado al padrón de un subevento en un evento privado',
  })
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post(':idEvento/subeventos/:idSubEvento/invitados')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async agregarInvitadoPrivado(
    @Param('idEvento', ParseIntPipe) idEvento: number,
    @Param('idSubEvento', ParseIntPipe) idSubEvento: number,
    @Body() dto: AgregarInvitadoDto,
    @Req() req: any,
  ) {
    const idUsuario = this.obtenerIdUsuarioAutenticado(req);
    return await this.organizadorService.agregarInvitadoPrivado(
      idEvento,
      idSubEvento,
      idUsuario,
      dto,
    );
  }

  @ApiOperation({
    summary:
      'Reenviar invitación de un subevento privado respetando cooldown de 8 horas',
  })
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post(':idEvento/subeventos/:idSubEvento/invitados/:idInvitacion/reenviar')
  async reenviarInvitacionPrivada(
    @Param('idEvento', ParseIntPipe) idEvento: number,
    @Param('idSubEvento', ParseIntPipe) idSubEvento: number,
    @Param('idInvitacion', ParseIntPipe) idInvitacion: number,
    @Req() req: any,
  ) {
    const idUsuario = this.obtenerIdUsuarioAutenticado(req);
    return await this.organizadorService.reenviarInvitacionPrivada(
      idEvento,
      idSubEvento,
      idInvitacion,
      idUsuario,
    );
  }

  @ApiOperation({
    summary: 'Revocar la invitación de un invitado en un subevento privado',
  })
  @Delete(':idEvento/subeventos/:idSubEvento/invitados/:idInvitacion')
  async revocarInvitacionPrivada(
    @Param('idEvento', ParseIntPipe) idEvento: number,
    @Param('idSubEvento', ParseIntPipe) idSubEvento: number,
    @Param('idInvitacion', ParseIntPipe) idInvitacion: number,
    @Req() req: any,
  ) {
    const idUsuario = this.obtenerIdUsuarioAutenticado(req);
    return await this.organizadorService.revocarInvitacionPrivada(
      idEvento,
      idSubEvento,
      idInvitacion,
      idUsuario,
    );
  }

  @ApiOperation({
    summary:
      'Cancelar un evento propio con justificación obligatoria y anulación de boletos',
  })
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Patch(':idEvento/cancelar')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async cancelarEventoPropio(
    @Param('idEvento', ParseIntPipe) idEvento: number,
    @Body() dto: CancelarSolicitudDto,
    @Req() req: any,
  ) {
    const idUsuario = this.obtenerIdUsuarioAutenticado(req);
    return await this.organizadorService.cancelarEventoPropio(
      idEvento,
      idUsuario,
      dto.motivo,
    );
  }

  @ApiOperation({
    summary:
      'Asignar directamente o invitar por correo (token 48h) a un colaborador como Personal de Logística',
  })
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post(':idEvento/personal-logistica')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async agregarPersonalLogistica(
    @Param('idEvento', ParseIntPipe) idEvento: number,
    @Body() dto: AgregarPersonalLogisticaDto,
    @Req() req: any,
  ) {
    const idUsuario = this.obtenerIdUsuarioAutenticado(req);
    const rolActor = this.obtenerRolUsuarioAutenticado(req);
    return await this.organizadorService.agregarPersonalLogistica(
      idEvento,
      idUsuario,
      dto,
      rolActor,
    );
  }

  @ApiOperation({
    summary:
      'Revocar los permisos de Personal de Logística a un usuario asignado a este evento',
  })
  @Delete(':idEvento/personal-logistica/:idUsuario')
  async revocarPersonalLogistica(
    @Param('idEvento', ParseIntPipe) idEvento: number,
    @Param('idUsuario', ParseIntPipe) idUsuarioLogistica: number,
    @Req() req: any,
  ) {
    const idUsuario = this.obtenerIdUsuarioAutenticado(req);
    return await this.organizadorService.revocarPersonalLogistica(
      idEvento,
      idUsuario,
      idUsuarioLogistica,
    );
  }
}

