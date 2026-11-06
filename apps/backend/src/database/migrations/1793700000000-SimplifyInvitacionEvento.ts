import { MigrationInterface, QueryRunner } from 'typeorm';

export class SimplifyInvitacionEvento1793700000000 implements MigrationInterface {
  name = 'SimplifyInvitacionEvento1793700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "invitacionEvento" (
        "idInvitacionEvento" integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        "idEvento" integer NOT NULL REFERENCES evento("idEvento") ON DELETE CASCADE,
        "idUsuario" integer NOT NULL REFERENCES usuario("idUsuario"),
        "fechaUltimoEnvio" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await queryRunner.query(`
      ALTER TABLE "invitacionEvento"
        DROP COLUMN IF EXISTS "tokenInvitacion",
        DROP COLUMN IF EXISTS "estado";
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_invitacionEvento_evento_usuario"
        ON "invitacionEvento" ("idEvento", "idUsuario");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "UQ_invitacionEvento_evento_usuario";
    `);

    await queryRunner.query(`
      ALTER TABLE "invitacionEvento"
        ADD COLUMN IF NOT EXISTS "tokenInvitacion" varchar(255) NOT NULL DEFAULT '',
        ADD COLUMN IF NOT EXISTS "estado" varchar(20) NOT NULL DEFAULT 'Activa';
    `);
  }
}
