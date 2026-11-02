import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddModalidadAccesoSubEvento1793500000000 implements MigrationInterface {
  name = 'AddModalidadAccesoSubEvento1793500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "subEvento" ADD COLUMN IF NOT EXISTS "modalidadAcceso" varchar(30) NOT NULL DEFAULT 'CON_RESERVACION' CHECK ("modalidadAcceso" IN ('ENTRADA_LIBRE', 'CON_RESERVACION'))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "subEvento" DROP COLUMN IF EXISTS "modalidadAcceso"`);
  }
}
