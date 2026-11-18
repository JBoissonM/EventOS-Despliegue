import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRetencionAsiento1793900000001
  implements MigrationInterface
{
  name = 'CreateRetencionAsiento1793900000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "retencionAsiento" (
        "idRetencionAsiento" integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        "idSubEvento" integer NOT NULL REFERENCES "subEvento"("idSubEvento") ON DELETE CASCADE,
        "idAsiento" integer NOT NULL REFERENCES asiento("idAsiento") ON DELETE CASCADE,
        "idUsuario" integer NOT NULL REFERENCES usuario("idUsuario") ON DELETE CASCADE,
        "venceEn" timestamp NOT NULL,
        "creadaEn" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        
        -- Restricciones de unicidad para evitar duplicidad de butacas o acaparamiento por usuario en un mismo subevento
        CONSTRAINT "UQ_subevento_asiento" UNIQUE ("idSubEvento", "idAsiento"),
        CONSTRAINT "UQ_subevento_usuario" UNIQUE ("idSubEvento", "idUsuario")
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_retencionAsiento_venceEn" 
      ON "retencionAsiento" ("venceEn");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_retencionAsiento_idUsuario" 
      ON "retencionAsiento" ("idUsuario");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_retencionAsiento_idUsuario";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_retencionAsiento_venceEn";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "retencionAsiento";`);
  }
}