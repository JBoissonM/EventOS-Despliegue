import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsPositive } from 'class-validator';

export class CrearRetencionDto {
    @ApiProperty({ example: 1, description: 'ID del subevento con modalidad QR_MAPA' })
    @IsNotEmpty({ message: 'El idSubEvento es obligatorio' })
    @IsInt({ message: 'El idSubEvento debe ser un número entero' })
    @IsPositive({ message: 'El idSubEvento debe ser un número positivo mayor a cero' })
    idSubEvento: number;

    @ApiProperty({ example: 1, description: 'ID del asiento físico del recinto' })
    @IsNotEmpty({ message: 'El idAsiento es obligatorio' })
    @IsInt({ message: 'El idAsiento debe ser un número entero' })
    @IsPositive({ message: 'El idAsiento debe ser un número positivo mayor a cero' })
    idAsiento: number;
}
