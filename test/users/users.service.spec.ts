import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { UUID } from 'crypto';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { AuthService } from 'src/auth/auth.service';
import { UserEntity } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';

describe('UsersService', () => {
  const userId = '11111111-1111-1111-1111-111111111111' as UUID;

  const usersRepoMock = {
    findOneBy: jest.fn<(params: unknown) => Promise<UserEntity | null>>(),
    save: jest.fn<(user: UserEntity) => Promise<UserEntity>>(),
    softDelete: jest.fn<(params: unknown) => Promise<void>>(),
    createQueryBuilder: jest.fn<() => unknown>(),
  };

  const authServiceMock = {
    signout: jest.fn<AuthService['signout']>(),
  } satisfies Pick<AuthService, 'signout'>;

  let service: UsersService;

  beforeEach(async () => {
    jest.clearAllMocks();

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
  });

  it('soft deletes a user and revokes sessions', async () => {
    usersRepoMock.findOneBy.mockResolvedValue({
      userId,
    } as UserEntity);
    usersRepoMock.softDelete.mockResolvedValue(undefined);
    authServiceMock.signout.mockResolvedValue(undefined);

    await expect(service.deleteUser(userId, 'soft')).resolves.toBeUndefined();

    expect(usersRepoMock.softDelete).toHaveBeenCalledWith({ userId });
    expect(authServiceMock.signout).toHaveBeenCalledWith(userId);
  });
});
