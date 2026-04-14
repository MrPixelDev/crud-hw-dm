import type { UUID } from 'crypto';
import { SessionEntity } from 'src/auth/entities/session.entity';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
@Unique('UQ_users_login', ['login'])
@Unique('UQ_users_email', ['email'])
export class UserEntity extends BaseEntity {
  @Column({ type: 'int', generated: 'increment' })
  id!: number;

  @PrimaryColumn({ type: 'uuid', name: 'user_id' })
  userId!: UUID;

  @Column({ type: 'varchar', length: 50 })
  login!: string;

  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({ type: 'text', name: 'password_hash', select: false })
  passwordHash!: string;

  @Column({ type: 'int' })
  age!: number;

  @Column({ type: 'varchar', length: 1000 })
  description!: string;

  @OneToMany(() => SessionEntity, sessionEntity => sessionEntity.user)
  sessions!: SessionEntity[];

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({
    type: 'timestamptz',
    name: 'deleted_at',
    select: false,
    default: null,
  })
  deletedAt!: Date;
}
