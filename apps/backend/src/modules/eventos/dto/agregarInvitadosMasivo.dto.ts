import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import type { AgregarInvitadosMasivoPayload } from '@eventos/shared';

export class AgregarInvitadosMasivoDto implements AgregarInvitadosMasivoPayload {
  @ApiProperty({
    description: 'Lote de correos electrónicos a invitar al subevento privado',
    example: ['asistente1@alumno.ipn.mx', 'externo@gmail.com'],
    type: [String],
  })
  @Transform(({ value }: { value: unknown }) =>
    Array.isArray(value)
      ? value.map((item) =>
          typeof item === 'string' ? item.trim().toLowerCase() : item,
        )
      : value,
  )
  @IsArray({ message: 'Debe proporcionar una lista válida de correos.' })
  @ArrayMinSize(1, {
    message: 'Debe incluir al menos un correo electrónico en el lote.',
  })
  @ArrayMaxSize(20, {
    message: 'Cada lote admite como máximo 20 correos electrónicos.',
  })
  @IsString({ each: true, message: 'Cada correo debe ser una cadena de texto.' })
  correos: string[];
}
