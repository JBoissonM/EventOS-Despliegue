import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'retencionAsiento' })
export class RetencionAsientoEntity {
  @PrimaryGeneratedColumn('identity', {
    name: 'idRetencionAsiento',
    generatedIdentity: 'ALWAYS',
  })
  idRetencionAsiento: number;

  @Column({ name: 'idSubEvento', type: 'int', nullable: false })
  idSubEvento: number;

  @Column({ name: 'idAsiento', type: 'int', nullable: false })
  idAsiento: number;

  @Column({ name: 'idUsuario', type: 'int', nullable: false })
  idUsuario: number;

  // Sin zona horaria. Toda comparación de vigencia se hace en SQL contra LOCALTIMESTAMP; no calcular vencimientos con Date de JavaScript.
  @Column({ name: 'venceEn', type: 'timestamp', nullable: false })
  venceEn: Date;

  @Column({
    name: 'creadaEn',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  creadaEn: Date;
}
