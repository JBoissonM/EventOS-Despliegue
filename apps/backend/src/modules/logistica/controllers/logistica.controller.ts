import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Req,
  ParseIntPipe,
  ForbiddenException,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { LogisticaService } from '../logistica.service';
import { RolesGuard } from '../../auth/roles.guard'; // Ajusta esta ruta si tu carpeta auth está en otro nivel
import { EscanearBoletoDto } from '../dto/escanear-boleto.dto';

@ApiTags('Logística')
@Controller('logistica')
export class LogisticaController {
  constructor(private readonly logisticaService: LogisticaService) {}


  private obtenerIdUsuarioAutenticado(req: any): number {
    const idUsuario = req.user?.sub ?? req.user?.idUsuario;
    if (!idUsuario) {
      throw new ForbiddenException('No se pudo identificar al usuario en el token.');
    }
    return Number(idUsuario);
  }

  @ApiOperation({ summary: 'UI18: Obtener subeventos asignados al personal de logística' })
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Get('mis-eventos')
  async obtenerMisEventos(@Req() req: any) {
    const usuarioId = this.obtenerIdUsuarioAutenticado(req);
    return await this.logisticaService.obtenerMisEventosAsignados(usuarioId);
  }

  @ApiOperation({ summary: 'Obtener aforo actual y lista de asistentes de un subevento' })
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Get('subeventos/:idSubEvento/control-acceso')
  async obtenerControlAcceso(
    @Req() req: any,
    @Param('idSubEvento', ParseIntPipe) idSubEvento: number,
  ) {
    const usuarioId = this.obtenerIdUsuarioAutenticado(req);
    return await this.logisticaService.obtenerControlAccesoSubEvento(usuarioId, idSubEvento);
  }

  @ApiOperation({ summary: 'Botón Abrir Escáner: Validar QR y registrar entrada del asistente' })
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @ApiBody({ type: EscanearBoletoDto }) 
  @Post('subeventos/:idSubEvento/escanear')
  async escanearBoleto(
    @Req() req: any,
    @Param('idSubEvento', ParseIntPipe) idSubEvento: number,
    @Body() body: EscanearBoletoDto, 
  ) {
    const usuarioId = this.obtenerIdUsuarioAutenticado(req);
    return await this.logisticaService.registrarEntradaPorQr(usuarioId, idSubEvento, body);
  }
}