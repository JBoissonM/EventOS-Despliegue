import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'reservaHistorial' })
export class ReservaHistorialEntity {
  @PrimaryColumn({ name: 'idBoleto', type: 'int' })
  idBoleto: number;

  @Column({ name: 'idSubEvento', type: 'int' })
  idSubEvento: number;

  @Column({ name: 'idUsuario', type: 'int' })
  idUsuario: number;

  @Column({ name: 'fechaAsociacion', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fechaAsociacion: Date;
}
