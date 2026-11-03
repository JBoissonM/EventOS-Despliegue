import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '../../auth/roles.guard';
import { OrganizadorService } from '../services/organizador.service';
import { ModificarLogisticaDto } from '../dto/modificarLogistica.dto';
import { ActualizarInfoGeneralDto } from '../dto/actualizarInfoGeneral.dto';
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
    return await this.organizadorService.obtenerDetalleOrganizador(
      idEvento,
      idUsuario,
    );
  }

  @ApiOperation({
    summary:
      'Solicitar o actualizar in-flight la modificación logística de un evento',
  })
  @Patch(':idEvento/logistica')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async solicitarModificacionLogistica(
    @Param('idEvento', ParseIntPipe) idEvento: number,
    @Body() dto: ModificarLogisticaDto,
    @Req() req: any,
  ) {
    const idUsuario = this.obtenerIdUsuarioAutenticado(req);
    return await this.organizadorService.solicitarModificacionLogistica(
      idEvento,
      idUsuario,
      dto,
    );
  }

  @ApiOperation({
    summary:
      'Actualizar información general, alcance, póster y ponentes de un evento con aprobación automática',
  })
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
    const idUsuario = this.obtenerIdUsuarioAutenticado(req);
    const posterFile = files?.file?.[0] ?? files?.poster?.[0];
    return await this.organizadorService.actualizarInfoGeneral(
      idEvento,
      idUsuario,
      dto,
      posterFile,
    );
  }
}

