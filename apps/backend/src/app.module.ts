import { ExecutionContext, Injectable, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import {
  ThrottlerException,
  ThrottlerGuard,
  ThrottlerModule,
} from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dbOptions } from './database/data-source';
import { StorageModule } from './common/storage/storage.module';
import { AuthModule } from './modules/auth/auth.module';
import { EventosModule } from './modules/eventos/eventos.module';
import { RecintosModule } from './modules/recintos/recintos.module';
import { ReservationsModule } from './modules/reservas/reservations.module';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { LogisticaModule } from './modules/logistica/logistica.module';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const forwarded = req.headers?.['x-forwarded-for'];
    const ip =
      typeof forwarded === 'string'
        ? forwarded.split(',')[0].trim()
        : req.ip || req.socket?.remoteAddress || 'unknown-ip';

    const idUsuario = req.user?.sub ?? req.user?.idUsuario;
    if (idUsuario) {
      return `usr-${idUsuario}-${ip}`;
    }

    const authHeader = req.headers?.authorization;
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      return `tkn-${authHeader.slice(-16)}-${ip}`;
    }

    return `ip-${ip}`;
  }

  protected async throwThrottlingException(
    context: ExecutionContext,
  ): Promise<void> {
    throw new ThrottlerException(
      'Has excedido el límite de intentos permitidos. Por favor, espera un minuto antes de volver a intentarlo.',
    );
  }
}

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000,
        limit: 100,
      },
    ]),
    TypeOrmModule.forRoot({
      ...dbOptions,
      autoLoadEntities: true,
      synchronize: false,
    }),
    StorageModule,
    AuthModule,
    EventosModule,
    RecintosModule,
    ReservationsModule, 
    UsuariosModule,
    LogisticaModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
  ],
})
export class AppModule {}