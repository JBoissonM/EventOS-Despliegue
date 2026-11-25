import {
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { EventosService } from '../services/eventos.service';
import {
  ACTIVE_USER_TOKENS,
  RolesGuard,
  TOKEN_BLACKLIST,
} from '../../auth/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { TipoCuentaUsuario } from '@eventos/shared';

@ApiTags('Eventos y Bitácora')
@Controller('eventos')
export class EventosController {
  constructor(
    private readonly eventosService: EventosService,
    private readonly jwtService: JwtService,
  ) {}

  // Extraemos el payload del JWT sin fallar cuando el usuario no ha iniciado sesión
  private async extraerUsuarioOpcional(req: any) {
    const authHeader = req?.headers?.authorization;
    if (!authHeader) return undefined;

    const [bearer, token] = authHeader.split(' ');
    if (bearer !== 'Bearer' || !token) return undefined;

    if (TOKEN_BLACKLIST.has(token)) {
      throw new ForbiddenException(
        'La sesión ya fue finalizada o reemplazada por otro inicio de sesión (HTTP 403).',
      );
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_PASS || 'clave_secreta',
      });

      const idUsuario = Number(payload?.sub ?? payload?.idUsuario);
      const tokenActivo = ACTIVE_USER_TOKENS.get(idUsuario);
      if (idUsuario && tokenActivo && tokenActivo !== token) {
        TOKEN_BLACKLIST.add(token);
        throw new ForbiddenException(
          'Tu sesión fue cerrada porque se inició sesión en otra ventana o dispositivo (HTTP 403).',
        );
      }

      return payload;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      return undefined;
    }
  }

  //Cartelera de eventos próximos (sin sesión: solo acceso libre; con sesión: internos o externos según cuenta)
  @ApiOperation({
    summary: 'Consultar cartelera de eventos próximos (Acceso libre sin sesión / Completo con sesión)',
  })
  @Get()
  async obtenerEventosPublicos(@Req() req: any) {
    const usuario = await this.extraerUsuarioOpcional(req);
    return await this.eventosService.obtenerEventosPublicos(usuario);
  }

  //Consultar Bitácora General de Movimientos
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Consultar bitácora general de movimientos del sistema (UI20)',
  })
  @Get('bitacora')
  @UseGuards(RolesGuard)
  @Roles(TipoCuentaUsuario.ADMINISTRADOR)
  async obtenerBitacoraGeneral(@Query('buscar') buscar?: string) {
    const movimientos = await this.eventosService.obtenerBitacoraGeneral(buscar);
    return {
      mensaje:
        movimientos.length === 0
          ? 'No hay registros de eventos disponibles. (MSG-E-32)'
          : 'Bitácora consultada con éxito.',
      total: movimientos.length,
      movimientos,
    };
  }

  //Exportar Bitácora General de Movimientos
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Exportar y descargar reporte de la bitácora general de movimientos (UI20)',
  })
  @Get('bitacora/exportar')
  @UseGuards(RolesGuard)
  @Roles(TipoCuentaUsuario.ADMINISTRADOR)
  async exportarBitacoraGeneral(
    @Query('buscar') buscar: string | undefined,
    @Res() res: any,
  ) {
    const reporte = await this.eventosService.exportarBitacoraGeneral(buscar);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${reporte.nombreArchivo}"`,
    );

    return res.status(200).send(reporte.contenidoCsv);
  }

  @ApiOperation({
    summary:
      'Consultar ficha informativa de un subevento privado mediante token compartible',
  })
  @Get('privado/:tokenSubEvento')
  async obtenerDetalleSubEventoPrivadoPorToken(
    @Param('tokenSubEvento') tokenSubEvento: string,
    @Req() req: any,
  ) {
    const usuario = await this.extraerUsuarioOpcional(req);
    return await this.eventosService.obtenerDetalleSubEventoPrivadoPorToken(
      tokenSubEvento,
      usuario,
    );
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Autorizar al usuario autenticado mediante el enlace compartible de un subevento privado',
  })
  @Post('privado/:tokenSubEvento/aceptar')
  @UseGuards(RolesGuard)
  async aceptarEnlaceSubEventoPrivado(
    @Param('tokenSubEvento') tokenSubEvento: string,
    @Req() req: any,
  ) {
    const idUsuario = Number(req.user?.sub ?? req.user?.idUsuario);
    if (!idUsuario) {
      throw new ForbiddenException(
        'No se pudo identificar al usuario en el token.',
      );
    }
    return await this.eventosService.aceptarEnlaceSubEventoPrivado(
      tokenSubEvento,
      idUsuario,
    );
  }

  // Obtener detalle de un evento con subeventos, fechas, recintos y ponentes
  @ApiOperation({
    summary: 'Consultar detalle de un evento aprobado',
  })
  @Get(':idEvento')
  async obtenerDetalleEventoPublico(
    @Param('idEvento', ParseIntPipe) idEvento: number,
    @Req() req: any,
  ) {
    const usuario = await this.extraerUsuarioOpcional(req);
    return await this.eventosService.obtenerDetalleEventoPublico(idEvento, usuario);
  }
}