import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ActivarCuentaLogisticaDto {
  @ApiProperty({
    description: 'Token criptográfico JWT de invitación con vigencia de 48 horas',
  })
  @IsNotEmpty({ message: 'El token de invitación es obligatorio.' })
  @IsString({ message: 'El token de invitación debe ser una cadena de texto válida.' })
  token: string;

  @ApiProperty({ example: 'Juan' })
  @IsNotEmpty({ message: 'El nombre es obligatorio.' })
  @IsString({ message: 'El nombre debe ser una cadena de texto.' })
  @MaxLength(50, { message: 'El nombre no debe superar los 50 caracteres.' })
  @Matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/, {
    message: 'El nombre solo debe contener letras.',
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  nombre: string;

  @ApiProperty({ example: 'Pérez' })
  @IsNotEmpty({ message: 'El apellido paterno es obligatorio.' })
  @IsString({ message: 'El apellido paterno debe ser una cadena de texto.' })
  @MaxLength(50, {
    message: 'El apellido paterno no debe superar los 50 caracteres.',
  })
  @Matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/, {
    message: 'El apellido paterno solo debe contener letras.',
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  apellidoPa: string;

  @ApiProperty({ example: 'López', required: false })
  @IsOptional()
  @IsString({ message: 'El apellido materno debe ser una cadena de texto.' })
  @MaxLength(50, {
    message: 'El apellido materno no debe superar los 50 caracteres.',
  })
  @Matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/, {
    message: 'El apellido materno solo debe contener letras.',
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  apellidoMa?: string;

  @ApiProperty({ example: 'Password123!' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria.' })
  @IsString({ message: 'La contraseña debe ser una cadena de texto.' })
  @MinLength(8, {
    message: 'La contraseña debe contener al menos 8 caracteres.',
  })
  contrasena: string;
}
