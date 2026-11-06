import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegistroDto } from './dto/registro.dto';
import { ActivarCuentaLogisticaDto } from './dto/activarCuentaLogistica.dto';
import { SolicitarRecuperacionDto } from './dto/solicitarRecuperacion.dto';
import { RestablecerContrasenaDto } from './dto/restablecerContrasena.dto';
import { RolesGuard } from './roles.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Registrar nuevo usuario' })
  @Post('registro')
  @HttpCode(HttpStatus.CREATED)
  async registrarUsuario(@Body() body: RegistroDto) {
    return await this.authService.registrar(body);
  }

  @ApiOperation({ summary: 'Iniciar sesión y obtener token JWT' })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async iniciarSesion(@Body() body: LoginDto) {
    return await this.authService.login(body);
  }

  @ApiOperation({
    summary:
      'Solicitar correo con enlace de recuperación de contraseña (15 min)',
  })
  @Post('recuperar-contrasena')
  @HttpCode(HttpStatus.OK)
  async solicitarRecuperacion(@Body() body: SolicitarRecuperacionDto) {
    return await this.authService.solicitarRecuperacionContrasena(body);
  }

  @ApiOperation({
    summary:
      'Validar vigencia e integridad del token de recuperación',
  })
  @Get('restablecer-contrasena/validar')
  @HttpCode(HttpStatus.OK)
  async validarTokenRecuperacion(@Query('token') token: string) {
    return await this.authService.validarTokenRecuperacion(token);
  }

  @ApiOperation({
    summary: 'Restablecer contraseña con token de un solo uso',
  })
  @Post('restablecer-contrasena')
  @HttpCode(HttpStatus.OK)
  async restablecerContrasena(@Body() body: RestablecerContrasenaDto) {
    return await this.authService.restablecerContrasena(body);
  }

  @ApiOperation({
    summary:
      'Activar cuenta mediante token JWT de invitación para Personal de Logística',
  })
  @Post('activar-logistica')
  @HttpCode(HttpStatus.CREATED)
  async activarCuentaLogistica(@Body() body: ActivarCuentaLogisticaDto) {
    return await this.authService.activarCuentaLogistica(body);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cerrar sesión activa e invalidar token JWT' })
  @Post('logout')
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.OK)
  async cerrarSesion(@Req() req: any) {
    const authHeader: string = req.headers?.authorization || '';
    const token = authHeader.split(' ')[1] || '';
    return await this.authService.logout(token);
  }
}