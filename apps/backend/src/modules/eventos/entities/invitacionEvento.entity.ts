import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UsuarioEntity } from '../../auth/entities/usuario.entity';
import { EventoEntity } from './evento.entity';

@Entity({ name: 'invitacionEvento' })
export class InvitacionEventoEntity {
  @PrimaryGeneratedColumn({ name: 'idInvitacionEvento', type: 'int' })
  idInvitacionEvento: number;

  @Column({ name: 'idEvento', type: 'int' })
  idEvento: number;

  @Column({ name: 'idUsuario', type: 'int' })
  idUsuario: number;

  @Column({ name: 'tokenInvitacion', type: 'varchar', length: 255 })
  tokenInvitacion: string;

  @CreateDateColumn({ name: 'fechaUltimoEnvio', type: 'timestamp' })
  fechaUltimoEnvio: Date;

  @Column({ name: 'estado', type: 'varchar', length: 20, default: 'Activa' })
  estado: string;

  @ManyToOne(() => EventoEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'idEvento' })
  evento?: EventoEntity;

  @ManyToOne(() => UsuarioEntity)
  @JoinColumn({ name: 'idUsuario' })
  usuario?: UsuarioEntity;
}

