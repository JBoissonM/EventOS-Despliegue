import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { SolicitarRecuperacionPayload } from '@eventos/shared';

export class SolicitarRecuperacionDto implements SolicitarRecuperacionPayload {
  @ApiProperty({
    description: 'Correo electrónico registrado del usuario',
    example: 'juan.perez@example.com',
    required: true,
  })
  @IsNotEmpty({
    message: 'Por favor, ingresa tu correo electrónico. (MSG-E-11)',
  })
  @IsString()
  @IsEmail({}, { message: 'Ingresa un correo electrónico válido.' })
  correo: string;
}