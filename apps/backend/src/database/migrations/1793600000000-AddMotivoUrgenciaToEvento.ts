import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMotivoUrgenciaToEvento1793600000000 implements MigrationInterface {
  name = 'AddMotivoUrgenciaToEvento1793600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "evento" ADD COLUMN IF NOT EXISTS "motivoUrgencia" text;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "evento" DROP COLUMN IF EXISTS "motivoUrgencia";`,
    );
  }
}
