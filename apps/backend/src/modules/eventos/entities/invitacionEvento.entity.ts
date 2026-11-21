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
import { SubEventoEntity } from './subevento.entity';

@Entity({ name: 'invitacionEvento' })
@Unique(['idSubEvento', 'idUsuario'])
export class InvitacionEventoEntity {
  @PrimaryGeneratedColumn({ name: 'idInvitacionEvento', type: 'int' })
  idInvitacionEvento: number;

  @Column({ name: 'idSubEvento', type: 'int' })
  idSubEvento: number;

  @Column({ name: 'idUsuario', type: 'int' })
  idUsuario: number;

  @CreateDateColumn({ name: 'fechaUltimoEnvio', type: 'timestamp' })
  fechaUltimoEnvio: Date;

  @ManyToOne(() => SubEventoEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'idSubEvento' })
  subEvento?: SubEventoEntity;

  @ManyToOne(() => UsuarioEntity)
  @JoinColumn({ name: 'idUsuario' })
  usuario?: UsuarioEntity;
}
