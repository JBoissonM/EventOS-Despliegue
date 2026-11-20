import { BadRequestException } from '@nestjs/common';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { memoryStorage } from 'multer';

/**
 * Crea la configuración de Multer (recepción + validación).
 * El archivo queda en memoria (file.buffer) y el StorageService lo sube.
 */
export function crearUploadOptions(
  tiposPermitidos: string[],
  maxMB: number,
  mensajeTipoNoPermitido?: string,
): MulterOptions {
  return {
    storage: memoryStorage(),
    limits: {
      fileSize: maxMB * 1024 * 1024, // si se excede responde 413
      fieldSize: 10 * 1024, // máximo 10 KB por campo de texto en multipart/form-data (anti-DoS)
      fields: 25,
    },
    fileFilter: (_req, file, cb) => {
      if (!tiposPermitidos.includes(file.mimetype)) {
        return cb(
          new BadRequestException(
            mensajeTipoNoPermitido ??
              `Tipo de archivo no permitido. Permitidos: ${tiposPermitidos.join(', ')}`,
          ),
          false,
        );
      }
      cb(null, true);
    },
  };
}

// Configuraciones listas para usar con FileInterceptor
export const posterOptions = crearUploadOptions(
  ['image/jpeg', 'image/png', 'image/webp'],
  5,
);

export const documentoOptions = crearUploadOptions(
  ['application/pdf', 'image/jpeg', 'image/png'],
  5,
);

export const documentoVerificacionOptions = crearUploadOptions(
  ['application/pdf'],
  5,
  'Solo se admiten documentos en formato PDF.',
);

/** Verifica por magic bytes que el buffer corresponda a un archivo PDF (%PDF-). */
export function esPdfValido(buffer: Buffer): boolean {
  if (!buffer || buffer.length < 5) {
    return false;
  }
  return buffer.subarray(0, 5).toString('ascii') === '%PDF-';
}
