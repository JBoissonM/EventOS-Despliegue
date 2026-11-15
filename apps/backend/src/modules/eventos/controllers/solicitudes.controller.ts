import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { TipoCuentaUsuario } from '@eventos/shared';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SolicitudesService } from '../services/solicitudes.service';
import { CrearSolicitudDto } from '../dto/crearSolicitud.dto';
import { CancelarSolicitudDto } from '../dto/cancelarSolicitud.dto';
import { StorageService } from '../../../common/storage/storage.service';
import { posterOptions } from '../../../common/upload/upload.options';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';

@ApiTags('Solicitudes')
@ApiBearerAuth()
@Controller('solicitudes')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class SolicitudesController {
  constructor(
    private readonly eventosService: SolicitudesService,
    private readonly storageService: StorageService,
  ) {}

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
          `No se permiten solicitudes para el mismo día (${fechaHoy}) o fechas pasadas, aunque sean urgentes.`,
        );
      }
    }
  }

  // Lista solicitudes filtradas por estado (ej. ?estado=Pendiente o ?estado=Aprobado). Solo Subdirección.
  @ApiOperation({
    summary: 'Listar solicitudes de eventos filtradas por estado',
  })
  @Get()
  @UseGuards(RolesGuard)
  @Roles(TipoCuentaUsuario.SUBDIRECCION)
  async listarSolicitudes(@Query('estado') estado?: string) {
    return await this.eventosService.listarSolicitudesPorEstado(estado);
  }

  // Detalle de solicitud para evaluación (CU03 / UI12). Protegido para Subdirección.
  @ApiOperation({
    summary: 'Obtener detalle de una solicitud para evaluación',
  })
  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(TipoCuentaUsuario.SUBDIRECCION)
  async obtenerDetalleSolicitud(@Param('id', ParseIntPipe) id: number) {
    return await this.eventosService.obtenerDetalleSolicitud(id);
  }

  @ApiOperation({
    summary: 'Aprobar solicitud de evento o modificación logística pendiente',
  })
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  @Patch(':id/aprobar')
  @UseGuards(RolesGuard)
  @Roles(TipoCuentaUsuario.SUBDIRECCION)
  async aprobarSolicitud(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ) {
    const idUsuarioActor = req.user?.sub ?? req.user?.idUsuario;
    return await this.eventosService.aprobarSolicitud(
      id,
      idUsuarioActor ? Number(idUsuarioActor) : undefined,
    );
  }

  @ApiOperation({
    summary: 'Rechazar solicitud de evento o modificación logística pendiente',
  })
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  @Patch(':id/rechazar')
  @UseGuards(RolesGuard)
  @Roles(TipoCuentaUsuario.SUBDIRECCION)
  async rechazarSolicitud(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
    @Req() req: any,
  ) {
    const idUsuarioActor = req.user?.sub ?? req.user?.idUsuario;
    const motivo =
      typeof body?.motivo === 'string'
        ? body.motivo
        : typeof body?.motivoRechazo === 'string'
          ? body.motivoRechazo
          : undefined;
    return await this.eventosService.rechazarSolicitud(
      id,
      idUsuarioActor ? Number(idUsuarioActor) : undefined,
      motivo,
    );
  }

  @ApiOperation({
    summary: 'Cancelar evento aprobado con motivo obligatorio',
  })
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Patch(':id/cancelar')
  @UseGuards(RolesGuard)
  @Roles(TipoCuentaUsuario.SUBDIRECCION)
  async cancelarSolicitud(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CancelarSolicitudDto,
    @Req() req: any,
  ) {
    const idUsuarioActor = req.user?.sub ?? req.user?.idUsuario;
    const rolActor = req.user?.tipoCuenta;
    return await this.eventosService.cancelarSolicitud(
      id,
      dto.motivo,
      idUsuarioActor ? Number(idUsuarioActor) : undefined,
      rolActor,
    );
  }

  @ApiOperation({
    summary: 'Crear nueva solicitud de evento',
  })
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(RolesGuard)
  @Roles(
    TipoCuentaUsuario.INTERNO,
    TipoCuentaUsuario.EXTERNO,
    TipoCuentaUsuario.SUBDIRECCION,
  )
  @UseInterceptors(FileInterceptor('poster', posterOptions))
  async crearSolicitud(
    @Body() dto: CrearSolicitudDto,
    @Req() req: any,
    @UploadedFile() posterFile?: Express.Multer.File,
  ) {
    this.validarFechasPosterioresAHoy(dto);

    // Si viene un archivo físico para el póster, lo sube a MinIO / S3 y obtiene la key
    const posterKey = posterFile
      ? await this.storageService.upload(posterFile, 'posters', 'public')
      : undefined;

    const idOrganizador = req.user?.sub;

    return await this.eventosService.registrarSolicitud(
      idOrganizador,
      dto,
      posterKey,
    );
  }
}
