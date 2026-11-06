import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { SolicitarRecuperacionPayload } from '@eventos/shared';

export class SolicitarRecuperacionDto implements SolicitarRecuperacionPayload {
  @IsNotEmpty({
    message: 'Por favor, ingresa tu correo electrónico. (MSG-E-11)',
  })
  @IsString()
  @IsEmail({}, { message: 'Ingresa un correo electrónico válido.' })
  correo: string;
}