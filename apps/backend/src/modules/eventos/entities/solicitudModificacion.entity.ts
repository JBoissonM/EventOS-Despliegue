import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import type { SubEventoLogisticaPayload } from '@eventos/shared';
import { EventoEntity } from './evento.entity';

@Entity({ name: 'solicitudModificacion' })
export class SolicitudModificacionEntity {
  @PrimaryGeneratedColumn({ name: 'idSolicitudModificacion', type: 'int' })
  idSolicitudModificacion: number;

  @Column({ name: 'idEvento', type: 'int' })
  idEvento: number;

  @ManyToOne(() => EventoEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'idEvento' })
  evento: Relation<EventoEntity>;

  @Column({ name: 'motivoModificacion', type: 'varchar', length: 500 })
  motivoModificacion: string;

  @Column({ name: 'subeventosPropuestos', type: 'jsonb' })
  subeventosPropuestos: SubEventoLogisticaPayload[];

  @Column({ name: 'estado', type: 'varchar', length: 50, default: 'Pendiente' })
  estado: string;

  @Column({ name: 'motivoRechazo', type: 'text', nullable: true })
  motivoRechazo?: string | null;
}

