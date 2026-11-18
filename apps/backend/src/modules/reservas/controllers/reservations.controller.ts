import { Controller, Post, Body, Get, Param, ParseIntPipe, Patch, UseGuards, Req, Header, StreamableFile, Query, Delete, HttpCode } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ReservationsService } from '../services/reservations.service';
import { TicketPdfService } from '../services/ticket-pdf.service';
import { CreateReservationDto } from '../dto/createReservation.dto';
import { CrearRetencionDto } from '../dto/crearRetencion.dto';
import { CambiarAsientoRetencionDto } from '../dto/cambiarAsientoRetencion.dto';
import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '../../auth/roles.guard';

@ApiTags('Reservations')
@Controller('reservations')
export class ReservationsController {
  constructor(
    private readonly reservationsService: ReservationsService,
    private readonly ticketPdfService: TicketPdfService,
  ) {}

  
  private obtenerIdUsuarioAutenticado(req: any): number {
    const idUsuario = req.user?.sub ?? req.user?.idUsuario;
    if (!idUsuario) {
      throw new ForbiddenException('No se pudo identificar al usuario en el token.');
    }
    return Number(idUsuario);
  }

  // Lista de eventos del usuario
  @ApiOperation({ summary: 'Consultar mis boletos y reservas activas' })
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Get('mis-boletos')
  async obtenerMisBoletos(@Req() req: any) {
    const idUsuario = this.obtenerIdUsuarioAutenticado(req);
    return await this.reservationsService.obtenerMisBoletos(idUsuario);
  }

  // Detalle de un boleto específico con QR al vuelo
  @ApiOperation({ summary: 'Obtener detalle de un boleto con código QR' })
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Get('mis-boletos/:idBoleto')
  async obtenerDetalleBoleto(
    @Req() req: any,
    @Param('idBoleto', ParseIntPipe) idBoleto: number,
  ) {
    const idUsuario = this.obtenerIdUsuarioAutenticado(req);
    return await this.reservationsService.obtenerDetalleBoleto(idUsuario, idBoleto);
  }

  @ApiOperation({ summary: 'Descargar boleto digital en PDF' })
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Header('Cache-Control', 'private, no-store')
  @Get('mis-boletos/:idBoleto/pdf')
  async descargarBoletoPdf(
    @Req() req: any,
    @Param('idBoleto', ParseIntPipe) idBoleto: number,
  ): Promise<StreamableFile> {
    const idUsuario = this.obtenerIdUsuarioAutenticado(req);
    const contenido = await this.ticketPdfService.generar(idUsuario, idBoleto);
    return new StreamableFile(contenido, {
      type: 'application/pdf',
      disposition: `attachment; filename="eventos-boleto-${idBoleto}.pdf"`,
    });
  }

  // Consultar lugares y asientos libres (Público para UI05 / UI05.1)
  @ApiOperation({ summary: 'Consultar disponibilidad de lugares y asientos de un subevento' })
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Get('disponibilidad/:idSubEvento')
  async consultarDisponibilidad(
    @Param('idSubEvento', ParseIntPipe) idSubEvento: number,
  ) {
    return await this.reservationsService.consultarDisponibilidad(idSubEvento);
  }

  // Crear una reserva con transacción atómica y QR
  @ApiOperation({ summary: 'Crear reserva de lugar y generar boleto QR' })
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post()
  async crearReserva(@Req() req: any, @Body() dto: CreateReservationDto) {
    const idUsuario = this.obtenerIdUsuarioAutenticado(req);
    return await this.reservationsService.crearReserva(idUsuario, dto);
  }

  // Apartar temporalmente un asiento en una actividad con mapa
  @ApiOperation({ summary: 'Apartar temporalmente un asiento (5 minutos) en una actividad con mapa' })
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Post('holds')
  async adquirirRetencion(@Req() req: any, @Body() dto: CrearRetencionDto) {
    const idUsuario = this.obtenerIdUsuarioAutenticado(req);
    return await this.reservationsService.adquirirRetencion(idUsuario, dto);
  }

  @ApiOperation({ summary: 'Consultar la retención de asiento vigente del usuario en un subevento' })
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @Get('holds/actual')
  async obtenerRetencionActual(
    @Req() req: any,
    @Query('idSubEvento', ParseIntPipe) idSubEvento: number,
  ) {
    const idUsuario = this.obtenerIdUsuarioAutenticado(req);
    return await this.reservationsService.obtenerRetencionActual(idUsuario, idSubEvento);
  }

  @ApiOperation({ summary: 'Cambiar el asiento de una retención vigente sin renovar su tiempo' })
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Patch('holds/:idRetencionAsiento')
  async cambiarAsientoRetencion(
    @Req() req: any,
    @Param('idRetencionAsiento', ParseIntPipe) idRetencionAsiento: number,
    @Body() dto: CambiarAsientoRetencionDto,
  ) {
    const idUsuario = this.obtenerIdUsuarioAutenticado(req);
    return await this.reservationsService.cambiarAsientoRetencion(
      idUsuario,
      idRetencionAsiento,
      dto,
    );
  }

  @ApiOperation({ summary: 'Liberar voluntariamente una retención de asiento' })
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Delete('holds/:idRetencionAsiento')
  @HttpCode(204)
  async liberarRetencion(
    @Req() req: any,
    @Param('idRetencionAsiento', ParseIntPipe) idRetencionAsiento: number,
  ): Promise<void> {
    const idUsuario = this.obtenerIdUsuarioAutenticado(req);
    await this.reservationsService.liberarRetencion(idUsuario, idRetencionAsiento);
  }

  // Cancelación lógica y liberación de lugar
  @ApiOperation({ summary: 'Cancelar reserva y liberar lugar' })
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Patch(':idBoleto/cancelar')
  async cancelarReserva(
    @Req() req: any,
    @Param('idBoleto', ParseIntPipe) idBoleto: number,
  ) {
    const idUsuario = this.obtenerIdUsuarioAutenticado(req);
    return await this.reservationsService.cancelarReserva(idUsuario, idBoleto);
  }
}