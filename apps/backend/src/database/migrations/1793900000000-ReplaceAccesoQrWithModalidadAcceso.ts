import { MigrationInterface, QueryRunner } from 'typeorm';

export class ReplaceAccesoQrWithModalidadAcceso1793900000000
  implements MigrationInterface
{
  name = 'ReplaceAccesoQrWithModalidadAcceso1793900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "modalidadAcceso" (
        "idModalidadAcceso" integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        modalidad varchar(50) NOT NULL
      );
    `);

    await queryRunner.query(`
      INSERT INTO "modalidadAcceso" ("idModalidadAcceso", modalidad) OVERRIDING SYSTEM VALUE
      VALUES
        (1, 'Acceso libre'),
        (2, 'Registro simple sin QR'),
        (3, 'QR Admisión general'),
        (4, 'QR con mapa de asientos')
      ON CONFLICT ("idModalidadAcceso") DO NOTHING;
    `);

    await queryRunner.query(`
      SELECT setval(
        pg_get_serial_sequence('"modalidadAcceso"', 'idModalidadAcceso'),
        COALESCE(MAX("idModalidadAcceso"), 1)
      )
      FROM "modalidadAcceso";
    `);

    await queryRunner.query(`
      ALTER TABLE "subEvento"
      ADD COLUMN IF NOT EXISTS "idModalidadAcceso" integer REFERENCES "modalidadAcceso"("idModalidadAcceso");
    `);

    const columnaAccesoQr = await queryRunner.query(`
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'subEvento'
        AND column_name = 'accesoQR'
      LIMIT 1;
    `);

    if (columnaAccesoQr.length > 0) {
      await queryRunner.query(`
        UPDATE "subEvento"
        SET "idModalidadAcceso" = CASE
          WHEN "accesoQR" = true AND "idRecinto" = 1 THEN 4
          WHEN "accesoQR" = true THEN 3
          ELSE 1
        END
        WHERE "idModalidadAcceso" IS NULL;
      `);

      await queryRunner.query(`
        ALTER TABLE "subEvento"
        DROP COLUMN "accesoQR";
      `);
    } else {
      await queryRunner.query(`
        UPDATE "subEvento"
        SET "idModalidadAcceso" = 1
        WHERE "idModalidadAcceso" IS NULL;
      `);
    }

    await queryRunner.query(`
      ALTER TABLE "subEvento"
      ALTER COLUMN "idModalidadAcceso" SET NOT NULL;
    `);

    await queryRunner.query(`
      UPDATE "solicitudModificacion"
      SET "subeventosPropuestos" = COALESCE(
        (
          SELECT jsonb_agg(
            CASE
              WHEN elem ? 'idModalidadAcceso' THEN elem - 'accesoQR'
              ELSE (elem - 'accesoQR') || jsonb_build_object(
                'idModalidadAcceso',
                CASE
                  WHEN COALESCE((elem->>'accesoQR')::boolean, false) = false THEN 1
                  WHEN COALESCE((elem->>'idRecinto')::int, 0) = 1 THEN 4
                  ELSE 3
                END
              )
            END
          )
          FROM jsonb_array_elements("subeventosPropuestos") AS elem
        ),
        '[]'::jsonb
      )
      WHERE jsonb_typeof("subeventosPropuestos") = 'array';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "subEvento"
      ADD COLUMN IF NOT EXISTS "accesoQR" boolean DEFAULT false;
    `);

    await queryRunner.query(`
      UPDATE "subEvento"
      SET "accesoQR" = ("idModalidadAcceso" IN (3, 4));
    `);

    await queryRunner.query(`
      ALTER TABLE "subEvento"
      ALTER COLUMN "accesoQR" SET NOT NULL;
    `);

    await queryRunner.query(`
      UPDATE "solicitudModificacion"
      SET "subeventosPropuestos" = COALESCE(
        (
          SELECT jsonb_agg(
            (elem - 'idModalidadAcceso') || jsonb_build_object(
              'accesoQR',
              COALESCE((elem->>'idModalidadAcceso')::int, 1) IN (3, 4)
            )
          )
          FROM jsonb_array_elements("subeventosPropuestos") AS elem
        ),
        '[]'::jsonb
      )
      WHERE jsonb_typeof("subeventosPropuestos") = 'array';
    `);

    await queryRunner.query(`
      ALTER TABLE "subEvento"
      DROP COLUMN IF EXISTS "idModalidadAcceso";
    `);

    await queryRunner.query(`
      DROP TABLE IF EXISTS "modalidadAcceso";
    `);
  }
}
