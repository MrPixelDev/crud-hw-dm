import type { UUID } from 'crypto';
import { ContentsTypesEnum } from 'src/common/consts/contents.consts';
import { UserEntity } from 'src/users/entities/user.entity';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('contents')
@Index('IDX_contents_user_type_deleted_at', ['userId', 'type', 'deletedAt'])
export class ContentEntity extends BaseEntity {
  @PrimaryGeneratedColumn({ name: 'content_id' })
  contentId!: number;

  @Column({ type: 'uuid', name: 'user_id' })
  userId!: UUID;

  @ManyToOne(() => UserEntity, userEntity => userEntity.contents, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @Column({
    type: 'enum',
    enum: ContentsTypesEnum,
    enumName: 'contents_type_enum',
    default: ContentsTypesEnum.FILE,
  })
  type!: ContentsTypesEnum;

  @Column({ type: 'varchar', name: 'file_name', length: 512 })
  fileName!: string;

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
  deletedAt!: Date | null;
}
