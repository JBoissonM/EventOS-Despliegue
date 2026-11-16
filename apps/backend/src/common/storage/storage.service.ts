import {
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { extname } from 'path';

// 'public'  -> se puede ver con URL directa (ej. póster)
// 'private' -> solo se ve con URL firmada temporal (ej. documento de identidad)
export type Visibilidad = 'public' | 'private';

/**
 * Único punto del sistema que toca archivos.
 * Habla el protocolo S3, así que funciona igual con MinIO (desarrollo) y
 * Cloudflare R2 (producción): solo cambian las variables del .env.
 */
@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);

  private readonly s3 = new S3Client({
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION ?? 'auto',
    forcePathStyle: true, // requerido por MinIO; R2 también lo acepta
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY ?? '',
      secretAccessKey: process.env.S3_SECRET_KEY ?? '',
    },
  });

  async onModuleInit(): Promise<void> {
    if (
      process.env.RENDER === 'true' &&
      process.env.NODE_ENV !== 'production'
    ) {
      this.logger.warn(
        'RENDER=true detectado con NODE_ENV distinto de "production". En el hosting se debe definir NODE_ENV=production.',
      );
    }

    if (process.env.NODE_ENV !== 'production') {
      return;
    }

    const variablesRequeridas = [
      'S3_ENDPOINT',
      'S3_ACCESS_KEY',
      'S3_SECRET_KEY',
      'S3_BUCKET_PUBLIC',
      'S3_BUCKET_PRIVATE',
      'S3_PUBLIC_URL',
    ] as const;

    const faltantes = variablesRequeridas.filter(
      (nombre) => !process.env[nombre] || process.env[nombre]!.trim() === '',
    );

    if (faltantes.length > 0) {
      throw new Error(
        `Faltan variables de entorno obligatorias para el almacenamiento S3 en producción: ${faltantes.join(', ')}`,
      );
    }

    const buckets = [this.bucket('public'), this.bucket('private')];
    for (const bucket of buckets) {
      try {
        await this.s3.send(new HeadBucketCommand({ Bucket: bucket }));
      } catch (error) {
        const err = error as Error;
        this.logger.error(
          `Error al verificar el bucket "${bucket}" (${err?.name ?? 'Error'}): ${err?.message ?? String(error)}`,
        );
      }
    }
  }

  private bucket(visibilidad: Visibilidad): string {
    return visibilidad === 'public'
      ? (process.env.S3_BUCKET_PUBLIC ?? 'eventos-public')
      : (process.env.S3_BUCKET_PRIVATE ?? 'eventos-private');
  }

  /** Guarda el archivo y devuelve la KEY (esto es lo que se guarda en la BD). */
  async upload(
    file: Express.Multer.File,
    folder: string,
    visibilidad: Visibilidad,
  ): Promise<string> {
    const key = `${folder}/${randomUUID()}${extname(file.originalname).toLowerCase()}`;
    if (process.env.NODE_ENV === 'test') {
      return key;
    }
    const bucket = this.bucket(visibilidad);
    try {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
          ...(visibilidad === 'public'
            ? { CacheControl: 'public, max-age=31536000, immutable' }
            : {}),
          ...(file.mimetype === 'application/pdf'
            ? { ContentDisposition: 'inline' }
            : {}),
        }),
      );
      return key;
    } catch (error) {
      const err = error as Error;
      if (process.env.NODE_ENV !== 'production') {
        this.logger.warn(
          `Storage upload warning (usando fallback simulado): ${err?.message ?? String(error)}`,
        );
        return key;
      }
      this.logger.error(
        `Error al subir archivo a S3 [bucket=${bucket}, key=${key}, ${err?.name ?? 'Error'}]: ${err?.message ?? String(error)}`,
      );
      throw new InternalServerErrorException('No se pudo almacenar el archivo');
    }
  }

  /** URL directa. Solo para archivos guardados como 'public'. */
  publicUrl(key: string): string {
    const baseUrl = (process.env.S3_PUBLIC_URL ?? '').replace(/\/+$/, '');
    const cleanKey = key.replace(/^\/+/, '');
    return `${baseUrl}/${cleanKey}`;
  }

  /** Resuelve una key o URL pública; devuelve null si está vacía. */
  resolvePublicUrl(keyOrUrl?: string | null): string | null {
    if (!keyOrUrl || keyOrUrl.trim() === '') {
      return null;
    }
    if (keyOrUrl.startsWith('http://') || keyOrUrl.startsWith('https://')) {
      return keyOrUrl;
    }
    return this.publicUrl(keyOrUrl);
  }

  /** URL temporal de lectura. Para archivos guardados como 'private'. */
  privateUrl(key: string, expiresInSeconds = 300): Promise<string> {
    return getSignedUrl(
      this.s3,
      new GetObjectCommand({ Bucket: this.bucket('private'), Key: key }),
      { expiresIn: expiresInSeconds },
    );
  }

  async delete(key: string, visibilidad: Visibilidad): Promise<void> {
    await this.s3.send(
      new DeleteObjectCommand({ Bucket: this.bucket(visibilidad), Key: key }),
    );
  }

  /** Borra un archivo si es una key válida; ignora vacíos/URLs externas y no lanza excepción si falla. */
  async deleteSafe(
    keyOrUrl: string | null | undefined,
    visibilidad: Visibilidad,
  ): Promise<void> {
    if (!keyOrUrl || keyOrUrl.trim() === '') {
      return;
    }
    if (
      keyOrUrl.startsWith('http://') ||
      keyOrUrl.startsWith('https://') ||
      keyOrUrl.startsWith('data:')
    ) {
      return;
    }
    if (process.env.NODE_ENV === 'test') {
      return;
    }
    const bucket = this.bucket(visibilidad);
    try {
      await this.s3.send(
        new DeleteObjectCommand({ Bucket: bucket, Key: keyOrUrl }),
      );
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Error al eliminar archivo en S3 [bucket=${bucket}, key=${keyOrUrl}, ${err?.name ?? 'Error'}]: ${err?.message ?? String(error)}`,
      );
    }
  }
}

