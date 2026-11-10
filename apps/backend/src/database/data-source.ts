import 'reflect-metadata';                      // activa la lectura de metadata de decoradores
import { DataSource, DataSourceOptions } from 'typeorm';

const host = process.env.DB_HOST ?? 'localhost';
// Si el host no es localhost (ej. Render) o DB_SSL es 'true', activamos SSL
const usarSsl = process.env.DB_SSL === 'true' || (host !== 'localhost' && host !== '127.0.0.1');

export const dbOptions: DataSourceOptions = {
  type: 'postgres',
  host,
  port: Number(process.env.DB_PORT ?? 5433),
  username: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'eventos',
  ssl: usarSsl ? { rejectUnauthorized: false } : false,
};

export default new DataSource({                 // este objeto solo lo usa el CLI de migraciones
  ...dbOptions,                                 // copia los datos de conexión de arriba
  entities: ['src/**/*.entity.ts'],             // dónde buscar las entidades (tablas)
  migrations: ['src/database/migrations/*.ts'], // dónde están/se guardan las migraciones
}); 