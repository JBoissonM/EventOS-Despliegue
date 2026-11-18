import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsPositive } from 'class-validator';

export class CambiarAsientoRetencionDto {
    @ApiProperty({ example: 1, description: 'ID del nuevo asiento físico del recinto' })
    @IsNotEmpty({ message: 'El idAsiento es obligatorio' })
    @IsInt({ message: 'El idAsiento debe ser un número entero' })
    @IsPositive({ message: 'El idAsiento debe ser un número positivo mayor a cero' })
    idAsiento: number;
}
