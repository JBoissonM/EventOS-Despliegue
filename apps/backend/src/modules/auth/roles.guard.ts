import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';

// Lista negra en memoria para invalidar tokens al cerrar sesión o abrir una nueva
export const TOKEN_BLACKLIST = new Set<string>();

// Registro de sesión única activa por usuario (idUsuario -> token vigente)
export const ACTIVE_USER_TOKENS = new Map<number, string>();

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new ForbiddenException(
        'Acceso denegado. No se proporcionó token de autenticación (HTTP 403).',
      );
    }

    const [bearer, token] = authHeader.split(' ');
    if (bearer !== 'Bearer' || !token) {
      throw new ForbiddenException('Formato de token inválido (HTTP 403).');
    }

    // Verificar si el token fue invalidado mediante logout o desplazado por otra sesión
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

      request.user = payload;

      const rolesRequeridos = this.reflector.get<string[]>(
        'roles',
        context.getHandler(),
      );
      if (rolesRequeridos && rolesRequeridos.length > 0) {
        const tieneRol = rolesRequeridos.includes(payload.tipoCuenta);
        if (!tieneRol) {
          throw new ForbiddenException(
            'No cuentas con los permisos suficientes para acceder a este recurso (HTTP 403).',
          );
        }
      }

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new ForbiddenException(
        'Token inválido, expirado o acceso no autorizado (HTTP 403).',
      );
    }
  }
}