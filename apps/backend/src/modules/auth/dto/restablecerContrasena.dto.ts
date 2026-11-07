import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { RestablecerContrasenaPayload } from '@eventos/shared';

export class RestablecerContrasenaDto implements RestablecerContrasenaPayload {
  @ApiProperty({
    description: 'Token JWT criptográfico de 15 minutos recibido por correo',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    required: true,
  })
  @IsNotEmpty({ message: 'El token es obligatorio.' })
  @IsString()
  token: string;

  @ApiProperty({
    description: 'Nueva contraseña (mínimo 8 caracteres, al menos una letra y un número)',
    example: 'NuevaPassword2026',
    required: true,
  })
  @IsNotEmpty({
    message: 'Todos los campos son obligatorios.',
  })
  @IsString()
  nuevaContrasena: string;

  @ApiProperty({
    description: 'Confirmación idéntica de la nueva contraseña',
    example: 'NuevaPassword2026',
    required: true,
  })
  @IsNotEmpty({
    message: 'Todos los campos son obligatorios.',
  })
  @IsString()
  confirmarContrasena: string;
}