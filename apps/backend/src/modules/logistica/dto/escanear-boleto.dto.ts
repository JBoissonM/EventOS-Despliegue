import { ApiPropertyOptional } from '@nestjs/swagger';

export class EscanearBoletoDto {
  @ApiPropertyOptional({
    description: 'El token extraído del código QR',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  tokenQr?: string;

  @ApiPropertyOptional({
    description: 'El ID numérico del boleto (alternativa manual al QR)',
    example: 10,
  })
  idBoleto?: number;
}