import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { EntityManager, Repository } from 'typeorm';
import { ISignupParams } from 'src/common/interfaces/auth.interface';
import { ProfileResponseDto } from './dto/profile-response.dto';
import { randomUUID, UUID } from 'crypto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly _usersRepo: Repository<UserEntity>
  ) {}

  private _getRepo(manager?: EntityManager): Repository<UserEntity> {
    return manager ? manager.getRepository(UserEntity) : this._usersRepo;
  }

  async create(
    data: ISignupParams,
    manager?: EntityManager
  ): Promise<UserEntity> {
    const userId = randomUUID();
    const repo = this._getRepo(manager);
    const user = repo.create({ userId, ...data });
    return repo.save(user);
  }

  async findById(
    id: number,
    manager?: EntityManager
  ): Promise<UserEntity | null> {
    return this._getRepo(manager).findOneBy({ id });
  }

  async findByUserId(
    userId: UUID,
    manager?: EntityManager
  ): Promise<UserEntity | null> {
    return this._getRepo(manager).findOneBy({ userId });
  }

  async findByLogin(
    login: string,
    manager?: EntityManager
  ): Promise<UserEntity | null> {
    return this._getRepo(manager).findOneBy({ login });
  }

  async findByEmail(
    email: string,
    manager?: EntityManager
  ): Promise<UserEntity | null> {
    return this._getRepo(manager).findOneBy({ email });
  }

  async findByLoginWithPasswordHash(
    login: string,
    manager?: EntityManager
  ): Promise<UserEntity | null> {
    return this._getRepo(manager)
      .createQueryBuilder('users')
      .addSelect('"users"."password_hash" AS "users_password_hash"')
      .where('login = :login', { login })
      .getOne();
  }

  async getOwnProfile(userId: UUID): Promise<ProfileResponseDto> {
    const user = await this.findByUserId(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return new ProfileResponseDto(user);
  }
}
