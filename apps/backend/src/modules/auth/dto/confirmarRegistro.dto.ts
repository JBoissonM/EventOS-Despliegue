import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { ConfirmarRegistroPayload } from '@eventos/shared';

export class ConfirmarRegistroDto implements ConfirmarRegistroPayload {
  @ApiProperty({
    description: 'Token JWT de confirmación recibido en el correo electrónico',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    required: true,
  })
  @IsNotEmpty({ message: 'El token de confirmación es obligatorio.' })
  @IsString()
  token: string;
}