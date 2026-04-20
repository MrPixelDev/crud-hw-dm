import type { UUID } from 'crypto';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ProfileController } from 'src/users/users.controller';
import type { UsersService } from 'src/users/users.service';
import { AllProfileRequestDto, UpdateUserDto } from 'src/users/dto/profile.dto';

describe('ProfileController', () => {
  const userId = '11111111-1111-1111-1111-111111111111' as UUID;

  const usersServiceMock = {
    getOwnProfile: jest.fn<UsersService['getOwnProfile']>(),
    getAllProfiles: jest.fn<UsersService['getAllProfiles']>(),
    updateUser: jest.fn<UsersService['updateUser']>(),
    deleteUser: jest.fn<UsersService['deleteUser']>(),
  } satisfies Pick<
    UsersService,
    'getOwnProfile' | 'getAllProfiles' | 'updateUser' | 'deleteUser'
  >;

  let controller: ProfileController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new ProfileController(usersServiceMock as never);
  });

  it('delegates own profile lookup to UsersService', async () => {
    const profile = {
      userId,
      login: 'testuser',
      email: 'testuser@example.com',
      age: 28,
      description: 'Тестовое описание',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    usersServiceMock.getOwnProfile.mockResolvedValue(profile);

    await expect(controller.getOwnProfile(userId)).resolves.toEqual(profile);
    expect(usersServiceMock.getOwnProfile).toHaveBeenCalledWith(userId);
  });

  it('delegates paginated profile lookup to UsersService', async () => {
    const dto: AllProfileRequestDto = {
      page: 2,
      limit: 5,
      filter: {
        login: 'testuser',
      },
    };
    const response = {
      users: [],
      total: 0,
      page: 2,
      limit: 5,
      totalPages: 0,
    };

    usersServiceMock.getAllProfiles.mockResolvedValue(response);

    await expect(controller.getAllProfiles(dto)).resolves.toEqual(response);
    expect(usersServiceMock.getAllProfiles).toHaveBeenCalledWith(dto);
  });

  it('delegates profile update to UsersService', async () => {
    const dto: UpdateUserDto = {
      description: 'Новое описание',
    };
    const response = {
      userId,
      login: 'testuser',
      email: 'testuser@example.com',
      age: 28,
      description: 'Новое описание',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    usersServiceMock.updateUser.mockResolvedValue(response);

    await expect(controller.updateUser(userId, dto)).resolves.toEqual(response);
    expect(usersServiceMock.updateUser).toHaveBeenCalledWith(userId, dto);
  });

  it('delegates soft delete to UsersService', async () => {
    usersServiceMock.deleteUser.mockResolvedValue(undefined);

    await expect(controller.deleteUser(userId)).resolves.toBeUndefined();
    expect(usersServiceMock.deleteUser).toHaveBeenCalledWith(userId, 'soft');
  });
});
