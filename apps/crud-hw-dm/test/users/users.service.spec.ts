import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { AuthService } from '@crud-hw-dm/auth/auth.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { PROFILE_ALL_CACHE_INDEX_KEY } from '@crud-hw-dm/common/consts/cache.constants';
import { UserEntity } from '@crud-hw-dm/users/entities/user.entity';
import { UsersService } from '@crud-hw-dm/users/users.service';

describe('UsersService', () => {
  const userId = crypto.randomUUID();

  const usersRepoMock = {
    findOneBy: jest.fn<(params: unknown) => Promise<UserEntity | null>>(),
    save: jest.fn<(user: UserEntity) => Promise<UserEntity>>(),
    softDelete: jest.fn<(params: unknown) => Promise<void>>(),
    createQueryBuilder: jest.fn<() => unknown>(),
  };

  const authServiceMock = {
    signout: jest.fn<AuthService['signout']>(),
  } satisfies Pick<AuthService, 'signout'>;

  const cacheManagerMock = {
    get: jest.fn<(key: string) => Promise<unknown>>(),
    set: jest.fn<
      (key: string, value: unknown, ttlSeconds?: number) => Promise<void>
    >(),
    del: jest.fn<(key: string) => Promise<boolean>>(),
    mdel: jest.fn<(keys: string[]) => Promise<boolean>>(),
  };

  let service: UsersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    cacheManagerMock.get.mockResolvedValue(undefined);
    cacheManagerMock.set.mockResolvedValue(undefined);
    cacheManagerMock.del.mockResolvedValue(true);
    cacheManagerMock.mdel.mockResolvedValue(true);

    const moduleRef = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: usersRepoMock,
        },
        {
          provide: AuthService,
          useValue: authServiceMock,
        },
        {
          provide: CACHE_MANAGER,
          useValue: cacheManagerMock,
        },
      ],
    }).compile();

    service = moduleRef.get(UsersService);
  });

  it('returns a public profile for the current user', async () => {
    const user = {
      userId,
      login: 'testuser',
      email: 'testuser@example.com',
      age: 28,
      description: 'Тестовое описание',
      createdAt: new Date('2025-01-01T00:00:00.000Z'),
      updatedAt: new Date('2025-01-02T00:00:00.000Z'),
    } as UserEntity;

    usersRepoMock.findOneBy.mockResolvedValue(user);

    await expect(service.getOwnProfile(userId)).resolves.toEqual({
      userId,
      login: 'testuser',
      email: 'testuser@example.com',
      age: 28,
      description: 'Тестовое описание',
      createdAt: new Date('2025-01-01T00:00:00.000Z'),
      updatedAt: new Date('2025-01-02T00:00:00.000Z'),
    });

    expect(cacheManagerMock.get).toHaveBeenCalledWith(`profile:my:${userId}`);
    expect(cacheManagerMock.set).toHaveBeenCalledWith(
      `profile:my:${userId}`,
      expect.objectContaining({ userId })
    );
  });

  it('returns own profile from cache without reading the repository', async () => {
    cacheManagerMock.get.mockResolvedValueOnce({
      userId,
      login: 'testuser',
      email: 'testuser@example.com',
      age: 28,
      description: 'Тестовое описание',
      avatar: null,
      activeAvatarCount: 0,
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-02T00:00:00.000Z',
    });

    await expect(service.getOwnProfile(userId)).resolves.toEqual({
      userId,
      login: 'testuser',
      email: 'testuser@example.com',
      age: 28,
      description: 'Тестовое описание',
      avatar: null,
      activeAvatarCount: 0,
      createdAt: new Date('2025-01-01T00:00:00.000Z'),
      updatedAt: new Date('2025-01-02T00:00:00.000Z'),
    });

    expect(usersRepoMock.findOneBy).not.toHaveBeenCalled();
    expect(cacheManagerMock.set).not.toHaveBeenCalled();
  });

  it('throws when the requested profile does not exist', async () => {
    usersRepoMock.findOneBy.mockResolvedValue(null);

    await expect(service.getOwnProfile(userId)).rejects.toBeInstanceOf(
      NotFoundException
    );
  });

  it('returns paginated profiles with total metadata', async () => {
    const users = [
      {
        userId,
        login: 'testuser',
        email: 'testuser@example.com',
        age: 28,
        description: 'Тестовое описание',
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
        updatedAt: new Date('2025-01-02T00:00:00.000Z'),
      },
    ] as UserEntity[];

    jest.spyOn(service, 'getUsers').mockResolvedValue({
      users,
      total: 1,
      totalPages: 1,
    });

    await expect(
      service.getAllProfiles({ page: 1, limit: 10, filter: undefined })
    ).resolves.toEqual({
      users: [
        {
          userId,
          login: 'testuser',
          email: 'testuser@example.com',
          age: 28,
          description: 'Тестовое описание',
          createdAt: new Date('2025-01-01T00:00:00.000Z'),
          updatedAt: new Date('2025-01-02T00:00:00.000Z'),
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    });

    expect(cacheManagerMock.set).toHaveBeenCalledWith(
      expect.stringMatching(/^profile:all:/),
      expect.objectContaining({ total: 1 })
    );
    expect(cacheManagerMock.set).toHaveBeenCalledWith(
      PROFILE_ALL_CACHE_INDEX_KEY,
      [expect.stringMatching(/^profile:all:/)]
    );
  });

  it('returns paginated profiles from cache without reading users', async () => {
    const getUsersSpy = jest.spyOn(service, 'getUsers');

    cacheManagerMock.get.mockResolvedValueOnce({
      users: [
        {
          userId,
          login: 'testuser',
          email: 'testuser@example.com',
          age: 28,
          description: 'Тестовое описание',
          avatar: null,
          activeAvatarCount: 0,
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-02T00:00:00.000Z',
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    });

    await expect(
      service.getAllProfiles({ page: 1, limit: 10, filter: undefined })
    ).resolves.toEqual({
      users: [
        {
          userId,
          login: 'testuser',
          email: 'testuser@example.com',
          age: 28,
          description: 'Тестовое описание',
          avatar: null,
          activeAvatarCount: 0,
          createdAt: new Date('2025-01-01T00:00:00.000Z'),
          updatedAt: new Date('2025-01-02T00:00:00.000Z'),
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    });

    expect(getUsersSpy).not.toHaveBeenCalled();
    expect(cacheManagerMock.set).not.toHaveBeenCalled();
  });

  it('returns a public profile after updating a user', async () => {
    const currentUser = {
      userId,
      login: 'testuser',
      email: 'testuser@example.com',
      age: 28,
      description: 'Тестовое описание',
      createdAt: new Date('2025-01-01T00:00:00.000Z'),
      updatedAt: new Date('2025-01-02T00:00:00.000Z'),
    } as UserEntity;
    const savedUser = {
      ...currentUser,
      description: 'Новое описание',
    } as UserEntity;

    usersRepoMock.findOneBy.mockResolvedValue(currentUser);
    usersRepoMock.save.mockResolvedValue(savedUser);

    await expect(
      service.updateUser(userId, { description: 'Новое описание' })
    ).resolves.toEqual({
      userId,
      login: 'testuser',
      email: 'testuser@example.com',
      age: 28,
      description: 'Новое описание',
      createdAt: new Date('2025-01-01T00:00:00.000Z'),
      updatedAt: new Date('2025-01-02T00:00:00.000Z'),
    });

    expect(cacheManagerMock.del).toHaveBeenCalledWith(`profile:my:${userId}`);
    expect(cacheManagerMock.del).toHaveBeenCalledWith(
      PROFILE_ALL_CACHE_INDEX_KEY
    );
  });

  it('soft deletes a user and revokes sessions', async () => {
    usersRepoMock.findOneBy.mockResolvedValue({
      userId,
    } as UserEntity);
    usersRepoMock.softDelete.mockResolvedValue(undefined);
    authServiceMock.signout.mockResolvedValue(undefined);

    await expect(service.deleteUser(userId, 'soft')).resolves.toBeUndefined();

    expect(usersRepoMock.softDelete).toHaveBeenCalledWith({ userId });
    expect(cacheManagerMock.del).toHaveBeenCalledWith(`profile:my:${userId}`);
    expect(cacheManagerMock.del).toHaveBeenCalledWith(
      PROFILE_ALL_CACHE_INDEX_KEY
    );
    expect(authServiceMock.signout).toHaveBeenCalledWith(userId);
  });
});
