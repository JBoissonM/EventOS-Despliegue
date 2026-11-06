import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { UsuarioEntity } from '../../auth/entities/usuario.entity';
import { EventoEntity } from './evento.entity';

@Entity({ name: 'invitacionEvento' })
@Unique(['idEvento', 'idUsuario'])
export class InvitacionEventoEntity {
  @PrimaryGeneratedColumn({ name: 'idInvitacionEvento', type: 'int' })
  idInvitacionEvento: number;

  @Column({ name: 'idEvento', type: 'int' })
  idEvento: number;

  @Column({ name: 'idUsuario', type: 'int' })
  idUsuario: number;

  @CreateDateColumn({ name: 'fechaUltimoEnvio', type: 'timestamp' })
  fechaUltimoEnvio: Date;

  @ManyToOne(() => EventoEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'idEvento' })
  evento?: EventoEntity;

  @ManyToOne(() => UsuarioEntity)
  @JoinColumn({ name: 'idUsuario' })
  usuario?: UsuarioEntity;
}
