import { IsEmail, IsNotEmpty, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import type { AgregarInvitadoPayload } from '@eventos/shared';

export class AgregarInvitadoDto implements AgregarInvitadoPayload {
  @ApiProperty({
    description: 'Correo electrónico de la cuenta activa que se invitará al evento privado',
    example: 'asistente@alumno.ipn.mx',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsNotEmpty({ message: 'Advertencia: Ingrese un correo válido.' })
  @IsEmail({}, { message: 'Advertencia: Ingrese un correo válido.' })
  @MaxLength(254, { message: 'El correo no puede exceder 254 caracteres.' })
  correo: string;
}

