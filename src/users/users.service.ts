import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { EntityManager, Repository } from 'typeorm';
import { ISignupParams } from 'src/common/interfaces/auth.interface';
import {
  AllProfileRequestDto,
  AllProfileResponseDto,
  ProfileResponseDto,
  UpdateUserDto,
} from './dto/profile.dto';
import { randomUUID, UUID } from 'crypto';
import {
  defaultGetUsersParams,
  IGetUsersParams,
} from 'src/common/interfaces/user.interface';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly _usersRepo: Repository<UserEntity>,
    @Inject(forwardRef(() => AuthService))
    private readonly _authSvc: AuthService
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

  async getUsers(
    params: IGetUsersParams = defaultGetUsersParams,
    manager?: EntityManager
  ): Promise<{ users: UserEntity[]; totalPages: number }> {
    const filter = params.filter ? params.filter : undefined;
    const queryBuilder = this._getRepo(manager).createQueryBuilder('user');

    if (filter?.login) {
      queryBuilder.where('login = :login', { login: filter.login });
    }

    const total = await queryBuilder.getCount();

    const users = await queryBuilder
      .skip((params.page - 1) * params.limit)
      .take(params.limit)
      .getMany();

    const totalPages = total === 0 ? 0 : Math.ceil(total / params.limit);

    return { users, totalPages };
  }

  async getOwnProfile(userId: UUID): Promise<ProfileResponseDto> {
    const user = await this.findByUserId(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return new ProfileResponseDto(user);
  }

  async getAllProfiles(
    data: AllProfileRequestDto
  ): Promise<AllProfileResponseDto> {
    const { users, totalPages } = await this.getUsers({
      pagination: true,
      page: data.page,
      limit: data.limit,
      filter: data.filter,
    });

    return new AllProfileResponseDto(users, data.page, data.limit, totalPages);
  }

  async updateUser(userId: UUID, data: UpdateUserDto): Promise<UserEntity> {
    const repo = this._getRepo();
    const currentUser = await repo.findOneBy({ userId });

    if (!currentUser) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = Object.assign(currentUser, data);
    return repo.save(updatedUser);
  }

  async deleteUser(userId: UUID, type: 'soft' | 'hard'): Promise<void> {
    const repo = this._getRepo();
    const user = await repo.findOneBy({ userId });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (type === 'soft') {
      await repo.softDelete({ userId });
    }

    return await this._authSvc.signout(userId);
  }
}
