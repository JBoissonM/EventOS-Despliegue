import { MigrationInterface, QueryRunner } from 'typeorm';

export class MigrateInvitacionToSubEvento1794000000000
  implements MigrationInterface
{
  name = 'MigrateInvitacionToSubEvento1794000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "subEvento"
        ADD COLUMN IF NOT EXISTS "tokenInvitacion" varchar(64),
        ADD COLUMN IF NOT EXISTS "enlaceInvitacionActivo" boolean NOT NULL DEFAULT false;
    `);

    await queryRunner.query(`
      UPDATE "subEvento"
      SET "tokenInvitacion" = gen_random_uuid()::text
      WHERE "tokenInvitacion" IS NULL OR TRIM("tokenInvitacion") = '';
    `);

    await queryRunner.query(`
      ALTER TABLE "subEvento"
        ALTER COLUMN "tokenInvitacion" SET NOT NULL;
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_subEvento_tokenInvitacion"
        ON "subEvento" ("tokenInvitacion");
    `);

    await queryRunner.query(`
      ALTER TABLE "invitacionEvento"
        ADD COLUMN IF NOT EXISTS "idSubEvento" integer REFERENCES "subEvento"("idSubEvento") ON DELETE CASCADE;
    `);

    const columnaIdEvento = await queryRunner.query(`
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'invitacionEvento'
        AND column_name = 'idEvento'
      LIMIT 1;
    `);

    if (columnaIdEvento.length > 0) {
      await queryRunner.query(`
        DROP INDEX IF EXISTS "UQ_invitacionEvento_evento_usuario";
      `);

      await queryRunner.query(`
        ALTER TABLE "invitacionEvento"
          DROP CONSTRAINT IF EXISTS "invitacionEvento_idEvento_idUsuario_key";
      `);

      await queryRunner.query(`
        INSERT INTO "invitacionEvento" ("idEvento", "idSubEvento", "idUsuario", "fechaUltimoEnvio")
        SELECT DISTINCT
          ie."idEvento",
          se."idSubEvento",
          ie."idUsuario",
          ie."fechaUltimoEnvio"
        FROM "invitacionEvento" ie
        INNER JOIN "subEvento" se ON se."idEvento" = ie."idEvento"
        WHERE ie."idSubEvento" IS NULL
          AND se.estado <> 'Cancelado'
          AND NOT EXISTS (
            SELECT 1
            FROM "invitacionEvento" existente
            WHERE existente."idSubEvento" = se."idSubEvento"
              AND existente."idUsuario" = ie."idUsuario"
          );
      `);

      await queryRunner.query(`
        DELETE FROM "invitacionEvento"
        WHERE "idSubEvento" IS NULL;
      `);

      await queryRunner.query(`
        ALTER TABLE "invitacionEvento"
          DROP COLUMN IF EXISTS "idEvento";
      `);
    }

    await queryRunner.query(`
      ALTER TABLE "invitacionEvento"
        ALTER COLUMN "idSubEvento" SET NOT NULL;
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_invitacionEvento_subevento_usuario"
        ON "invitacionEvento" ("idSubEvento", "idUsuario");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "UQ_invitacionEvento_subevento_usuario";
    `);

    await queryRunner.query(`
      ALTER TABLE "invitacionEvento"
        ADD COLUMN IF NOT EXISTS "idEvento" integer REFERENCES evento("idEvento") ON DELETE CASCADE;
    `);

    await queryRunner.query(`
      UPDATE "invitacionEvento" ie
      SET "idEvento" = se."idEvento"
      FROM "subEvento" se
      WHERE ie."idSubEvento" = se."idSubEvento"
        AND ie."idEvento" IS NULL;
    `);

    await queryRunner.query(`
      DELETE FROM "invitacionEvento" a
      USING "invitacionEvento" b
      WHERE a."idInvitacionEvento" > b."idInvitacionEvento"
        AND a."idEvento" = b."idEvento"
        AND a."idUsuario" = b."idUsuario";
    `);

    await queryRunner.query(`
      ALTER TABLE "invitacionEvento"
        ALTER COLUMN "idEvento" SET NOT NULL;
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_invitacionEvento_evento_usuario"
        ON "invitacionEvento" ("idEvento", "idUsuario");
    `);

    await queryRunner.query(`
      ALTER TABLE "invitacionEvento"
        DROP COLUMN IF EXISTS "idSubEvento";
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "UQ_subEvento_tokenInvitacion";
    `);

    await queryRunner.query(`
      ALTER TABLE "subEvento"
        DROP COLUMN IF EXISTS "enlaceInvitacionActivo",
        DROP COLUMN IF EXISTS "tokenInvitacion";
    `);
  }
}
