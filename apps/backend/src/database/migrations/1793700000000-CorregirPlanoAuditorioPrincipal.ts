import type { MigrationInterface, QueryRunner } from 'typeorm';

type FilaAsiento = { idAsiento: number; fila: string; numero: number };

export class CorregirPlanoAuditorioPrincipal1793700000000 implements MigrationInterface {
  name = 'CorregirPlanoAuditorioPrincipal1793700000000';

  private planoReal(): Set<string> {
    const plano = new Set<string>();
    for (const fila of 'ABCDEFGHIJK') {
      for (let numero = 1; numero <= 23; numero++) {
        const corresponde = fila === 'A'
          ? [4, 5, 6, 9, 10, 11, 12, 13, 14, 15, 16, 18, 19, 20].includes(numero)
          : fila === 'B'
            ? numero >= 2 && numero <= 22
            : true;
        if (corresponde) plano.add(`${fila}-${numero}`);
      }
    }
    return plano;
  }

  private async obtenerAsientos(queryRunner: QueryRunner): Promise<FilaAsiento[]> {
    return await queryRunner.query(
      'SELECT "idAsiento", fila, numero FROM asiento WHERE "idRecinto" = 1 ORDER BY fila, numero',
    );
  }

  private diferencias(asientos: FilaAsiento[], plano: Set<string>) {
    const claves = asientos.map((a) => `${a.fila}-${a.numero}`);
    const existentes = new Set(claves);
    if (existentes.size !== claves.length) {
      throw new Error('El auditorio tiene posiciones duplicadas; no es seguro modificarlo.');
    }
    return {
      sobrantes: asientos.filter((a) => !plano.has(`${a.fila}-${a.numero}`)),
      faltantes: [...plano].filter((clave) => !existentes.has(clave)),
    };
  }

  private async comprobarRecinto(queryRunner: QueryRunner): Promise<void> {
    const recintos = await queryRunner.query(
      'SELECT nombre, aforo FROM recinto WHERE "idRecinto" = 1',
    );
    if (recintos.length !== 1 || recintos[0].nombre !== 'Auditorio Principal' || ![242, 250].includes(Number(recintos[0].aforo))) {
      throw new Error('El recinto 1 no coincide con el Auditorio Principal esperado.');
    }
  }

  private async comprobarBoletos(queryRunner: QueryRunner, ids: number[]): Promise<void> {
    const resultado = await queryRunner.query(
      'SELECT COUNT(*)::int AS total FROM boleto WHERE "idAsiento" = ANY($1::int[])',
      [ids],
    );
    if (Number(resultado[0].total) > 0) {
      throw new Error('Existen boletos asociados a posiciones que se quieren retirar. No se modifico ningun asiento.');
    }
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('LOCK TABLE recinto, asiento, boleto IN ACCESS EXCLUSIVE MODE');
    await this.comprobarRecinto(queryRunner);

    const actuales = await this.obtenerAsientos(queryRunner);
    const plano = this.planoReal();
    const { sobrantes, faltantes } = this.diferencias(actuales, plano);

    if (actuales.length === 242 && sobrantes.length === 0 && faltantes.length === 0) {
      await queryRunner.query('UPDATE recinto SET aforo = 242 WHERE "idRecinto" = 1');
      return;
    }

    const sobrantesEsperados = new Set(['A-1', 'A-2', 'A-3', 'A-7', 'A-8', 'A-17', 'A-21', 'A-22', 'A-23', 'B-1', 'B-23']);
    const faltantesEsperados = new Set(['K-11', 'K-12', 'K-13']);

    if (actuales.length !== 250 || sobrantes.length !== 11 || faltantes.length !== 3 ||
      sobrantes.some((a) => !sobrantesEsperados.has(`${a.fila}-${a.numero}`)) ||
      faltantes.some((clave) => !faltantesEsperados.has(clave))) {
      throw new Error('La distribucion de asientos no corresponde al diagnostico esperado. No se aplicaron cambios.');
    }

    const ids = sobrantes.map((a) => Number(a.idAsiento));
    await this.comprobarBoletos(queryRunner, ids);
    await queryRunner.query('DELETE FROM asiento WHERE "idAsiento" = ANY($1::int[])', [ids]);
    await queryRunner.query('INSERT INTO asiento (fila, numero, "idRecinto") VALUES ($1, $2, 1), ($1, $3, 1), ($1, $4, 1)', ['K', 11, 12, 13]);
    await queryRunner.query('UPDATE recinto SET aforo = 242 WHERE "idRecinto" = 1');

    const resultantes = await this.obtenerAsientos(queryRunner);
    const comprobacion = this.diferencias(resultantes, plano);
    if (resultantes.length !== 242 || comprobacion.sobrantes.length || comprobacion.faltantes.length) {
      throw new Error('La verificacion posterior fallo; se revertira toda la transaccion.');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('LOCK TABLE recinto, asiento, boleto IN ACCESS EXCLUSIVE MODE');
    await this.comprobarRecinto(queryRunner);
    const actuales = await this.obtenerAsientos(queryRunner);
    const plano = this.planoReal();
    const { sobrantes, faltantes } = this.diferencias(actuales, plano);
    if (actuales.length !== 242 || sobrantes.length || faltantes.length) {
      throw new Error('No es seguro revertir: la distribucion actual ya cambio.');
    }

    const nuevos = actuales.filter((a) => a.fila === 'K' && [11, 12, 13].includes(Number(a.numero)));
    if (nuevos.length !== 3) throw new Error('Faltan los asientos K11 a K13.');
    await this.comprobarBoletos(queryRunner, nuevos.map((a) => Number(a.idAsiento)));
    await queryRunner.query('DELETE FROM asiento WHERE "idAsiento" = ANY($1::int[])', [nuevos.map((a) => Number(a.idAsiento))]);
    await queryRunner.query(`
      INSERT INTO asiento (fila, numero, "idRecinto") VALUES
      ('A',1,1),('A',2,1),('A',3,1),('A',7,1),('A',8,1),('A',17,1),
      ('A',21,1),('A',22,1),('A',23,1),('B',1,1),('B',23,1)
    `);
    await queryRunner.query('UPDATE recinto SET aforo = 250 WHERE "idRecinto" = 1');
  }
}
