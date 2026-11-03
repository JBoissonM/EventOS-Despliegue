import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import type { AsistenteEvento } from '@eventos/shared';

@Entity({ name: 'asistenteEvento' })
export class AsistenteEventoEntity implements AsistenteEvento {
  @PrimaryGeneratedColumn({ name: 'idAsistenteEvento', type: 'int' })
  idAsistenteEvento: number;

  @Column({ name: 'idSubEvento', type: 'int' })
  idSubEvento: number;

  @Column({ name: 'idUsuario', type: 'int' })
  idUsuario: number;

  @Column({ name: 'idBoleto', type: 'int', nullable: true })
  idBoleto: number | null;
}
