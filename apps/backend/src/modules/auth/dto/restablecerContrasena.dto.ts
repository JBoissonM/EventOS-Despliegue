import { IsNotEmpty, IsString } from 'class-validator';
import { RestablecerContrasenaPayload } from '@eventos/shared';

export class RestablecerContrasenaDto implements RestablecerContrasenaPayload {
  @IsNotEmpty({ message: 'El token es obligatorio. (MSG-E-20)' })
  @IsString()
  token: string;

  @IsNotEmpty({
    message: 'Todos los campos son obligatorios. (MSG-E-11)',
  })
  @IsString()
  nuevaContrasena: string;

  @IsNotEmpty({
    message: 'Todos los campos son obligatorios. (MSG-E-11)',
  })
  @IsString()
  confirmarContrasena: string;
}