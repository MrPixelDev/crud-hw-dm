import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { DataSource, EntityManager } from 'typeorm';
import { AuthService } from 'src/auth/auth.service';
import type {
  IAuthenticatedUser,
  IRefreshTokenPayload,
  ITokenPair,
} from 'src/common/interfaces/auth.interface';
import { SessionEntity } from 'src/auth/entities/session.entity';
import { UsersService } from 'src/users/users.service';
import { UserEntity } from 'src/users/entities/user.entity';

describe('AuthService', () => {
  const userId = crypto.randomUUID();

  type AuthServiceInternals = {
    _verifyRefreshToken(refreshToken: string): Promise<IRefreshTokenPayload>;
    _issueTokenPair(
      user: IAuthenticatedUser,
      sessionId: number,
      refreshJti: string
    ): Promise<ITokenPair>;
    _buildRefreshTokenExpiresAt(): Date;
  };

  const sessionRepoMock = {
    create: jest.fn<(data: Partial<SessionEntity>) => SessionEntity>(),
    save: jest.fn<(session: SessionEntity) => Promise<SessionEntity>>(),
    findOneBy: jest.fn<(params: unknown) => Promise<SessionEntity | null>>(),
    createQueryBuilder: jest.fn<() => unknown>(),
  };

  const jwtServiceMock = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };

  const configServiceMock = {
    get: jest.fn((key: string) => {
      const values: Record<string, string> = {
        JWT_ACCESS_SECRET: 'access-secret',
        JWT_REFRESH_SECRET: 'refresh-secret',
        JWT_ACCESS_EXPIRES_IN: '3m',
        JWT_REFRESH_EXPIRES_IN: '3m',
      };

      return values[key];
    }),
  };

  const usersServiceMock = {
    findByLoginWithPasswordHash:
      jest.fn<UsersService['findByLoginWithPasswordHash']>(),
    findByUserId: jest.fn<UsersService['findByUserId']>(),
    findByEmail: jest.fn<UsersService['findByEmail']>(),
    create: jest.fn<UsersService['create']>(),
  } satisfies Pick<
    UsersService,
    'findByLoginWithPasswordHash' | 'findByUserId' | 'findByEmail' | 'create'
  >;

  const dataSourceMock = {
    transaction:
      jest.fn<
        (
          callback: (manager: EntityManager) => Promise<unknown>
        ) => Promise<unknown>
      >(),
  };

  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: jwtServiceMock,
        },
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
        {
          provide: DataSource,
          useValue: dataSourceMock,
        },
        {
          provide: getRepositoryToken(SessionEntity),
          useValue: sessionRepoMock,
        },
        {
          provide: UsersService,
          useValue: usersServiceMock,
        },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
  });

  it('revokes all active sessions on signout', async () => {
    const queryBuilderMock = {
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      execute: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
    };

    sessionRepoMock.createQueryBuilder.mockReturnValue(queryBuilderMock);

    await expect(service.signout(userId)).resolves.toBeUndefined();

    expect(sessionRepoMock.createQueryBuilder).toHaveBeenCalledWith();
    expect(queryBuilderMock.update).toHaveBeenCalledTimes(1);
    expect(queryBuilderMock.set).toHaveBeenCalledWith({
      revokedAt: expect.any(Date),
    });
    expect(queryBuilderMock.where).toHaveBeenCalledWith(
      'user_id = :userId AND revoked_at IS NULL',
      { userId }
    );
    expect(queryBuilderMock.execute).toHaveBeenCalledTimes(1);
  });

  it('refresh rotates the stored refresh token and returns a new pair', async () => {
    const serviceWithInternals = service as unknown as AuthServiceInternals;
    const session = Object.assign(new SessionEntity(), {
      id: 7,
      userId,
      refreshJti: 'old-jti',
      revokedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    });
    const manager = {
      getRepository: jest.fn().mockReturnValue(sessionRepoMock),
    } as unknown as EntityManager;
    const tokenPair = {
      accessToken: 'next-access-token',
      refreshToken: 'next-refresh-token',
    };

    serviceWithInternals._verifyRefreshToken = jest
      .fn<AuthServiceInternals['_verifyRefreshToken']>()
      .mockResolvedValue({
        sub: userId,
        sid: 7,
        jti: 'old-jti',
        type: 'refresh',
      });
    serviceWithInternals._issueTokenPair = jest
      .fn<AuthServiceInternals['_issueTokenPair']>()
      .mockResolvedValue(tokenPair);
    serviceWithInternals._buildRefreshTokenExpiresAt = jest
      .fn<AuthServiceInternals['_buildRefreshTokenExpiresAt']>()
      .mockReturnValue(new Date('2030-01-01T00:00:00.000Z'));

    sessionRepoMock.findOneBy.mockResolvedValue(session);
    // eslint-disable-next-line @typescript-eslint/require-await
    sessionRepoMock.save.mockImplementation(async current => current);
    usersServiceMock.findByUserId.mockResolvedValue({
      userId,
      login: 'testuser',
    } as UserEntity);
    dataSourceMock.transaction.mockImplementation(async callback => {
      return await callback(manager);
    });

    await expect(
      service.refresh({ refreshToken: 'current-refresh-token' })
    ).resolves.toEqual(tokenPair);

    expect(sessionRepoMock.findOneBy).toHaveBeenCalledWith({ id: 7 });
    expect(usersServiceMock.findByUserId).toHaveBeenCalledWith(userId, manager);
    expect(session.refreshJti).not.toEqual('old-jti');
    expect(session.expiresAt.toISOString()).toEqual('2030-01-01T00:00:00.000Z');
    expect(sessionRepoMock.save).toHaveBeenCalledWith(session);
  });

  it('refresh rejects revoked sessions', async () => {
    const serviceWithInternals = service as unknown as AuthServiceInternals;
    const revokedSession = Object.assign(new SessionEntity(), {
      id: 7,
      userId,
      refreshJti: 'old-jti',
      revokedAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
    });
    const manager = {
      getRepository: jest.fn().mockReturnValue(sessionRepoMock),
    } as unknown as EntityManager;

    serviceWithInternals._verifyRefreshToken = jest
      .fn<AuthServiceInternals['_verifyRefreshToken']>()
      .mockResolvedValue({
        sub: userId,
        sid: 7,
        jti: 'old-jti',
        type: 'refresh',
      });

    sessionRepoMock.findOneBy.mockResolvedValue(revokedSession);
    dataSourceMock.transaction.mockImplementation(async callback => {
      return await callback(manager);
    });

    await expect(
      service.refresh({ refreshToken: 'current-refresh-token' })
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
