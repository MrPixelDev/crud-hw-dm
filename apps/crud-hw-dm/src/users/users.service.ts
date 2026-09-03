import {
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { Between, EntityManager, MoreThan, Raw, Repository } from 'typeorm';
import { ISignupParams } from '@crud-hw-dm/common/interfaces/auth.interface';
import {
  AddMoneyRequestDto,
  AllProfileRequestDto,
  ProfileResponseDto,
  ProfilesResponseDto,
  TransferMoneyRequestDto,
  UpdateUserDto,
} from './dto/profile.dto';
import { createHash, randomUUID } from 'crypto';
import type { UUID } from 'crypto';
import { defaultGetUsersParams } from '@crud-hw-dm/common/interfaces/user.interface';
import type { IGetUsersParams } from '@crud-hw-dm/common/interfaces/user.interface';
import { AuthService } from '@crud-hw-dm/auth/auth.service';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  PROFILE_ALL_CACHE_INDEX_KEY,
  PROFILE_ALL_CACHE_PREFIX,
  PROFILE_MOST_ACTIVE_CACHE_INDEX_KEY,
  PROFILE_MOST_ACTIVE_CACHE_PREFIX,
  PROFILE_MY_CACHE_PREFIX,
} from '@crud-hw-dm/common/consts/cache.constants';
import {
  BALANCE_DEFAULT,
  MAX_BALANCE,
} from '@crud-hw-dm/common/consts/balance.constants';
import {
  IsolationLevel,
  runOnTransactionCommit,
  Transactional,
} from 'typeorm-transactional';

@Injectable()
export class UsersService {
  private readonly _logger = new Logger(UsersService.name);

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

  private _getMostActiveUsersCacheKey(from: number, to: number): string {
    return `${PROFILE_MOST_ACTIVE_CACHE_PREFIX}:${from}:${to}`;
  }

  private async _registerMostActiveUsersCacheKey(key: string): Promise<void> {
    const keys =
      (await this._getCachedValue<string[]>(
        PROFILE_MOST_ACTIVE_CACHE_INDEX_KEY
      )) ?? [];

    await this._setCachedValue(PROFILE_MOST_ACTIVE_CACHE_INDEX_KEY, [
      ...keys,
      key,
    ]);
  }

  private async _deleteMostActiveUsersCache(): Promise<void> {
    const keys =
      (await this._getCachedValue<string[]>(
        PROFILE_MOST_ACTIVE_CACHE_INDEX_KEY
      )) ?? [];

    try {
      if (keys.length) {
        await this._cacheManager.mdel(keys);
      }
    } catch (e) {
      this._logger.warn(
        `Cache error deleteMostActiveUsersCache: ${e instanceof Error ? e.message : String(e)}`
      );
      return;
    } finally {
      await this._deleteCachedValue(PROFILE_MOST_ACTIVE_CACHE_INDEX_KEY);
    }
  }

  private async _getCachedValue<T>(key: string): Promise<T | null> {
    try {
      const value = await this._cacheManager.get<T>(key);

      if (value) {
        this._logger.debug(`Cached ${key} value found`);
      } else {
        this._logger.debug(`Cached ${key} value not found`);
      }

      return value ?? null;
    } catch (e) {
      this._logger.warn(
        `Cache error getting ${key}: ${e instanceof Error ? e.message : String(e)}`
      );
      return null;
    }
  }

  private async _setCachedValue<T>(key: string, value: T): Promise<void> {
    try {
      await this._cacheManager.set(key, value);
      this._logger.debug(`Cache ${key} was set`);
    } catch (e) {
      this._logger.warn(
        `Cache error setting ${key}: ${e instanceof Error ? e.message : String(e)}`
      );
      return;
    }
  }

  private async _deleteCachedValue(key: string): Promise<void> {
    try {
      await this._cacheManager.del(key);
      this._logger.debug(`Cache ${key} was deleted`);
    } catch (e) {
      this._logger.warn(
        `Cache error deleting ${key}: ${e instanceof Error ? e.message : String(e)}`
      );
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
      this._logger.debug(`Deleted AllProfilesCache: ${keys.length}`);
    } catch (e) {
      this._logger.warn(
        `Cache error deleteAllProfilesCache: ${e instanceof Error ? e.message : String(e)}`
      );
      return;
    } finally {
      await this._deleteCachedValue(PROFILE_ALL_CACHE_INDEX_KEY);
    }
  }

  private async _deleteProfileCache(userId: UUID): Promise<void> {
    await this._deleteCachedValue(this._getOwnProfileCacheKey(userId));
    await this._deleteAllProfilesCache();
  }

  private _moneyStrToNum(value: string): number {
    const [wholes, fraction = ''] = value.split('.');

    return Number(wholes) * 100 + Number(fraction.padEnd(2, '0'));
  }

  private _moneyNumToStr(value: number): string {
    const wholes = Math.floor(value / 100);
    const fraction = String(value % 100).padStart(2, '0');

    return `${wholes}.${fraction}`;
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

  async deleteContentProfileCache(userId: UUID): Promise<void> {
    await this._deleteProfileCache(userId);
    await this._deleteMostActiveUsersCache();
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

    const profile = new ProfileResponseDto(user, { includeBalance: true });

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

    const cacheKey = this._getMostActiveUsersCacheKey(from, to);
    const cachedProfiles =
      await this._getCachedValue<ProfilesResponseDto>(cacheKey);

    if (cachedProfiles) {
      return this._restoreProfilesResponse(cachedProfiles);
    }

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

    const profiles = new ProfilesResponseDto(
      result,
      result.length,
      1,
      result.length,
      1
    );

    await this._setCachedValue(cacheKey, profiles);
    await this._registerMostActiveUsersCacheKey(cacheKey);

    return profiles;
  }

  @Transactional({ isolationLevel: IsolationLevel.READ_COMMITTED })
  async addMoney(
    userId: UUID,
    data: AddMoneyRequestDto
  ): Promise<ProfileResponseDto> {
    const user = await this._usersRepo
      .createQueryBuilder('user')
      .setLock('pessimistic_write')
      .where('user.userId = :userId', { userId })
      .getOne();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const amount = this._moneyStrToNum(data.amount);

    if (amount < 1) {
      throw new ConflictException('Amount must be greater than 0');
    }

    const userBalance = this._moneyStrToNum(user.balance);
    const newBalance = userBalance + amount;

    if (newBalance > MAX_BALANCE) {
      throw new ConflictException('Balance limit exceeded');
    }

    const newBalanceStr = this._moneyNumToStr(newBalance);
    user.balance = newBalanceStr;

    await this._usersRepo.save(user);
    runOnTransactionCommit(() => {
      void this._deleteProfileCache(userId);
    });

    return new ProfileResponseDto(user, { includeBalance: true });
  }

  @Transactional({ isolationLevel: IsolationLevel.READ_COMMITTED })
  async transferMoney(
    senderId: UUID,
    data: TransferMoneyRequestDto
  ): Promise<ProfileResponseDto> {
    const users = await this._usersRepo
      .createQueryBuilder('user')
      .setLock('pessimistic_write')
      .where('user.userId IN (:...userIds)', {
        userIds: [senderId, data.recipientId],
      })
      .orderBy('user.userId', 'ASC')
      .getMany();

    const sender = users.find(user => user.userId === senderId);
    const recipient = users.find(user => user.userId === data.recipientId);

    if (!(sender && recipient)) {
      throw new NotFoundException('User not found');
    }

    const amount = this._moneyStrToNum(data.amount);
    const senderBalance = this._moneyStrToNum(sender.balance);
    const recipientBalance = this._moneyStrToNum(recipient.balance);

    if (senderBalance < amount) {
      throw new ConflictException('Insufficient balance');
    }

    if (recipientBalance + amount > MAX_BALANCE) {
      throw new ConflictException('Recipient balance limit exceeded');
    }

    const newSenderBalance = this._moneyNumToStr(senderBalance - amount);
    const newRecipientBalance = this._moneyNumToStr(recipientBalance + amount);

    sender.balance = newSenderBalance;
    recipient.balance = newRecipientBalance;

    await this._usersRepo.save([sender, recipient]);

    runOnTransactionCommit(() => {
      void this._deleteProfileCache(senderId);
      void this._deleteProfileCache(data.recipientId);
    });

    return new ProfileResponseDto(sender, { includeBalance: true });
  }

  @Transactional({ isolationLevel: IsolationLevel.READ_COMMITTED })
  async resetBalances(): Promise<void> {
    await this._usersRepo
      .createQueryBuilder('user')
      .update(UserEntity)
      .set({ balance: BALANCE_DEFAULT })
      .where('deleted_at IS NULL')
      .andWhere('balance <> :balance', { balance: BALANCE_DEFAULT })
      .execute();

    runOnTransactionCommit(() => {
      void this._deleteAllProfilesCache();
    });
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
    await this._deleteMostActiveUsersCache();

    return new ProfileResponseDto(savedUser, { includeBalance: true });
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
    await this._deleteMostActiveUsersCache();

    return await this._authSvc.signout(userId);
  }

  async deleteMostActiveUsersCache(): Promise<void> {
    await this._deleteMostActiveUsersCache();
  }
}
