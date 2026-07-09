import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { Between, EntityManager, MoreThan, Raw, Repository } from 'typeorm';
import { ISignupParams } from 'src/common/interfaces/auth.interface';
import {
  AllProfileRequestDto,
  ProfileResponseDto,
  ProfilesResponseDto,
  UpdateUserDto,
} from './dto/profile.dto';
import { createHash, randomUUID, UUID } from 'crypto';
import {
  defaultGetUsersParams,
  IGetUsersParams,
} from 'src/common/interfaces/user.interface';
import { AuthService } from 'src/auth/auth.service';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  PROFILE_ALL_CACHE_INDEX_KEY,
  PROFILE_ALL_CACHE_PREFIX,
  PROFILE_MY_CACHE_PREFIX,
} from 'src/common/consts/cache.constants';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly _usersRepo: Repository<UserEntity>,
    @Inject(forwardRef(() => AuthService))
    private readonly _authSvc: AuthService,
    @Inject(CACHE_MANAGER)
    private readonly _cacheManager: Cache
  ) {}

  private _getRepo(manager?: EntityManager): Repository<UserEntity> {
    return manager ? manager.getRepository(UserEntity) : this._usersRepo;
  }

  private _getOwnProfileCacheKey(userId: UUID): string {
    return `${PROFILE_MY_CACHE_PREFIX}:${userId}`;
  }

  private _getAllProfilesCacheKey(data: AllProfileRequestDto): string {
    const filterHash = createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex')
      .slice(0, 16);

    return `${PROFILE_ALL_CACHE_PREFIX}:${filterHash}`;
  }

  private async _getCachedValue<T>(key: string): Promise<T | null> {
    try {
      return (await this._cacheManager.get<T>(key)) ?? null;
    } catch {
      return null;
    }
  }

  private async _setCachedValue<T>(key: string, value: T): Promise<void> {
    try {
      await this._cacheManager.set(key, value);
    } catch {
      return;
    }
  }

  private async _deleteCachedValue(key: string): Promise<void> {
    try {
      await this._cacheManager.del(key);
    } catch {
      return;
    }
  }

  private async _registerAllProfilesCacheKey(key: string): Promise<void> {
    const keys =
      (await this._getCachedValue<string[]>(PROFILE_ALL_CACHE_INDEX_KEY)) ?? [];

    await this._setCachedValue(PROFILE_ALL_CACHE_INDEX_KEY, [...keys, key]);
  }

  private async _deleteAllProfilesCache(): Promise<void> {
    const keys =
      (await this._getCachedValue<string[]>(PROFILE_ALL_CACHE_INDEX_KEY)) ?? [];

    try {
      if (keys.length) {
        await this._cacheManager.mdel(keys);
      }
    } catch {
      return;
    } finally {
      await this._deleteCachedValue(PROFILE_ALL_CACHE_INDEX_KEY);
    }
  }

  private async _deleteProfileCache(userId: UUID): Promise<void> {
    await this._deleteCachedValue(this._getOwnProfileCacheKey(userId));
    await this._deleteAllProfilesCache();
  }

  private _restoreProfileResponse(
    profile: ProfileResponseDto
  ): ProfileResponseDto {
    return {
      ...profile,
      createdAt: new Date(profile.createdAt),
      updatedAt: new Date(profile.updatedAt),
    };
  }

  private _restoreProfilesResponse(
    profiles: ProfilesResponseDto
  ): ProfilesResponseDto {
    return {
      ...profiles,
      users: profiles.users.map(profile =>
        this._restoreProfileResponse(profile)
      ),
    };
  }

  async create(
    data: ISignupParams,
    manager?: EntityManager
  ): Promise<UserEntity> {
    const userId = randomUUID();
    const repo = this._getRepo(manager);
    const user = repo.create({ userId, ...data });
    const savedUser = await repo.save(user);

    await this._deleteAllProfilesCache();

    return savedUser;
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
  ): Promise<{ users: UserEntity[]; total: number; totalPages: number }> {
    const filter = params.filter ? params.filter : undefined;
    const queryBuilder = this._getRepo(manager).createQueryBuilder('user');

    if (filter?.login) {
      queryBuilder.where('user.login = :login', { login: filter.login });
    }

    const total = await queryBuilder.getCount();

    const users = await queryBuilder
      .orderBy('user.createdAt', 'DESC')
      .addOrderBy('user.userId', 'ASC')
      .skip((params.page - 1) * params.limit)
      .take(params.limit)
      .getMany();

    const totalPages = total === 0 ? 0 : Math.ceil(total / params.limit);

    return { users, total, totalPages };
  }

  async getOwnProfile(userId: UUID): Promise<ProfileResponseDto> {
    const cacheKey = this._getOwnProfileCacheKey(userId);
    const cachedProfile =
      await this._getCachedValue<ProfileResponseDto>(cacheKey);

    if (cachedProfile) {
      return this._restoreProfileResponse(cachedProfile);
    }

    const user = await this.findByUserId(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const profile = new ProfileResponseDto(user);

    await this._setCachedValue(cacheKey, profile);

    return profile;
  }

  async getAllProfiles(
    data: AllProfileRequestDto
  ): Promise<ProfilesResponseDto> {
    const cacheKey = this._getAllProfilesCacheKey(data);
    const cachedProfiles =
      await this._getCachedValue<ProfilesResponseDto>(cacheKey);

    if (cachedProfiles) {
      return this._restoreProfilesResponse(cachedProfiles);
    }

    const { users, total, totalPages } = await this.getUsers({
      pagination: true,
      page: data.page,
      limit: data.limit,
      filter: data.filter,
    });

    const profiles = new ProfilesResponseDto(
      users,
      total,
      data.page,
      data.limit,
      totalPages
    );

    await this._setCachedValue(cacheKey, profiles);
    await this._registerAllProfilesCacheKey(cacheKey);

    return profiles;
  }

  async getMostActiveUsers(
    ages: [number, number],
    manager?: EntityManager
  ): Promise<ProfilesResponseDto> {
    const [from, to] = ages;

    const repo = this._getRepo(manager);

    const result = await repo.find({
      where: {
        activeAvatarCount: MoreThan(2),
        description: Raw(
          alias => `${alias} IS NOT NULL AND btrim(${alias}) <> ''`
        ),
        age: Between(from, to),
      },
      order: {
        activeAvatarCount: 'DESC',
        userId: 'ASC',
      },
    });

    return new ProfilesResponseDto(result, result.length, 1, result.length, 1);
  }

  async updateUser(
    userId: UUID,
    data: UpdateUserDto
  ): Promise<ProfileResponseDto> {
    const repo = this._getRepo();
    const currentUser = await repo.findOneBy({ userId });

    if (!currentUser) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = Object.assign(currentUser, data);
    const savedUser = await repo.save(updatedUser);

    await this._deleteProfileCache(userId);

    return new ProfileResponseDto(savedUser);
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

    await this._deleteProfileCache(userId);

    return await this._authSvc.signout(userId);
  }
}
