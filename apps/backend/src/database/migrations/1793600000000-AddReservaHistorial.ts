import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReservaHistorial1793600000000 implements MigrationInterface {
  name = 'AddReservaHistorial1793600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "reservaHistorial" (
        "idBoleto" integer PRIMARY KEY REFERENCES "boleto"("idBoleto"),
        "idSubEvento" integer NOT NULL REFERENCES "subEvento"("idSubEvento"),
        "idUsuario" integer NOT NULL REFERENCES "usuario"("idUsuario"),
        "fechaAsociacion" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await queryRunner.query(`
      INSERT INTO "reservaHistorial" ("idBoleto", "idSubEvento", "idUsuario")
      SELECT "idBoleto", "idSubEvento", "idUsuario"
      FROM "asistenteEvento"
      WHERE "idBoleto" IS NOT NULL
      ON CONFLICT ("idBoleto") DO NOTHING
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_reservaHistorial_usuario_subEvento"
      ON "reservaHistorial" ("idUsuario", "idSubEvento")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const historical = await queryRunner.query(`
      SELECT COUNT(*)::int AS total
      FROM "reservaHistorial" h
      WHERE NOT EXISTS (
        SELECT 1 FROM "asistenteEvento" a
        WHERE a."idBoleto" = h."idBoleto"
          AND a."idUsuario" = h."idUsuario"
          AND a."idSubEvento" = h."idSubEvento"
      )
    `);
    if (Number(historical[0]?.total ?? 0) > 0) {
      throw new Error('No es seguro revertir: existen boletos historicos que perderian su vinculacion.');
    }
    await queryRunner.query('DROP TABLE IF EXISTS "reservaHistorial"');
  }
}
