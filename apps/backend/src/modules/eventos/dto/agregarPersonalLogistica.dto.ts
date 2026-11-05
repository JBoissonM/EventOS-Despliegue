import { IsEmail, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class AgregarPersonalLogisticaDto {
  @ApiProperty({
    description:
      'Correo electrónico del colaborador a invitar o asignar como personal de logística',
    example: 'colaborador@ipn.mx',
  })
  @IsNotEmpty({ message: 'El correo electrónico es obligatorio.' })
  @IsEmail({}, { message: 'Advertencia: Ingrese un correo válido.' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  correo: string;
}
