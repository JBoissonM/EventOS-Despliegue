import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMotivoRechazoToEvento1793800000000 implements MigrationInterface {
  name = 'AddMotivoRechazoToEvento1793800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "evento" ADD COLUMN IF NOT EXISTS "motivoRechazo" text;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "evento" DROP COLUMN IF EXISTS "motivoRechazo";`,
    );
  }
}
