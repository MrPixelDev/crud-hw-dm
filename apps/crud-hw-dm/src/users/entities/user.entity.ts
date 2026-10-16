import type { UUID } from 'crypto';
import { SessionEntity } from '@crud-hw-dm/auth/entities/session.entity';
import {
  BALANCE_DEFAULT,
  BALANCE_PRECISION,
  BALANCE_SCALE,
} from '@crud-hw-dm/common/consts/balance.constants';
import { ContentEntity } from '@crud-hw-dm/contents/entities/contents.entities';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryColumn,
  Unique,
  UpdateDateColumn,
  Check,
} from 'typeorm';

@Entity('users')
@Unique('UQ_users_login', ['login'])
@Unique('UQ_users_email', ['email'])
@Check('Check_positive_balance', '"balance" >= 0')
@Index(
  'IDX_users_descr_age_avatar_count',
  ['userId', 'age', 'activeAvatarCount'],
  {
    where: `"description" IS NOT NULL AND btrim("description") <> ''`,
  }
)
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

  @Column({
    type: 'numeric',
    precision: BALANCE_PRECISION,
    scale: BALANCE_SCALE,
    default: BALANCE_DEFAULT,
  })
  balance!: string;

  @OneToMany(() => SessionEntity, sessionEntity => sessionEntity.user)
  sessions!: SessionEntity[];

  @OneToMany(() => ContentEntity, contentEntity => contentEntity.user)
  contents!: ContentEntity[];

  @Column({
    type: 'int',
    name: 'active_avatar_count',
    default: 0,
  })
  activeAvatarCount!: number;

  @Column({
    type: 'varchar',
    length: 512,
    default: null,
  })
  avatar!: string | null;

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
