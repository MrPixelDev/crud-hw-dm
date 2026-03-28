import type { UUID } from 'crypto';
import { UserEntity } from '../entities/user.entity';

export class ProfileResponseDto {
  userId!: UUID;
  login!: string;
  email!: string;
  age!: number;
  description!: string;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(user: UserEntity) {
    this.userId = user.userId;
    this.login = user.login;
    this.email = user.email;
    this.age = user.age;
    this.description = user.description;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
  }
}
