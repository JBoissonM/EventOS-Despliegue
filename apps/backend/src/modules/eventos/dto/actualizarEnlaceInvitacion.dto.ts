import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import type { ActualizarEnlaceInvitacionPayload } from '@eventos/shared';

export class ActualizarEnlaceInvitacionDto
  implements ActualizarEnlaceInvitacionPayload
{
  @ApiProperty({
    description: 'Indica si el enlace compartible de invitación está activo',
    example: true,
  })
  @IsBoolean({ message: 'El estado del enlace debe ser un valor booleano.' })
  activo: boolean;
}
