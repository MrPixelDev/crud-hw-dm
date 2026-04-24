import {
  CanActivate,
  ExecutionContext,
  Module,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals';
import { Test } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import type { OpenAPIObject } from '@nestjs/swagger';
import type { UUID } from 'crypto';
import { AuthController } from 'src/auth/auth.controller';
import { AuthService } from 'src/auth/auth.service';
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard';
import { setupSwagger } from 'src/common/swagger/swagger.config';
import { ProfileController } from 'src/users/users.controller';
import { UsersService } from 'src/users/users.service';

const testUserId = '11111111-1111-1111-1111-111111111111' as UUID;

class TestAccessTokenGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
      user?: {
        sub: UUID;
        login: string;
        type: 'access';
      };
    }>();

    if (!request.headers.authorization) {
      throw new UnauthorizedException();
    }

    request.user = {
      sub: testUserId,
      login: 'testuser',
      type: 'access',
    };

    return true;
  }
}

const authServiceMock = {
  signup: jest.fn<AuthService['signup']>().mockResolvedValue({
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
  }),
  signin: jest.fn<AuthService['signin']>().mockResolvedValue({
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
  }),
  refresh: jest.fn<AuthService['refresh']>().mockResolvedValue({
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
  }),
  changePassword: jest.fn<AuthService['changePassword']>().mockResolvedValue({
    accessToken: 'next-access-token',
    refreshToken: 'next-refresh-token',
  }),
  signout: jest.fn<AuthService['signout']>().mockResolvedValue(undefined),
} satisfies Pick<
  AuthService,
  'signup' | 'signin' | 'refresh' | 'changePassword' | 'signout'
>;

const usersServiceMock = {
  getOwnProfile: jest.fn<UsersService['getOwnProfile']>().mockResolvedValue({
    userId: testUserId,
    login: 'testuser',
    email: 'testuser@example.com',
    age: 28,
    description: 'Тестовое описание',
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
    updatedAt: new Date('2025-01-02T00:00:00.000Z'),
  }),
  getAllProfiles: jest.fn<UsersService['getAllProfiles']>().mockResolvedValue({
    users: [],
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  }),
  updateUser: jest.fn<UsersService['updateUser']>().mockResolvedValue({
    userId: testUserId,
    login: 'testuser',
    email: 'testuser@example.com',
    age: 29,
    description: 'Новое описание',
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
    updatedAt: new Date('2025-01-03T00:00:00.000Z'),
  }),
  deleteUser: jest
    .fn<UsersService['deleteUser']>()
    .mockResolvedValue(undefined),
} satisfies Pick<
  UsersService,
  'getOwnProfile' | 'getAllProfiles' | 'updateUser' | 'deleteUser'
>;

@Module({
  controllers: [AuthController, ProfileController],
  providers: [
    {
      provide: AuthService,
      useValue: authServiceMock,
    },
    {
      provide: UsersService,
      useValue: usersServiceMock,
    },
    {
      provide: AccessTokenGuard,
      useValue: {},
    },
  ],
})
class TestAppModule {}

describe('Backend Workflow (e2e)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    const moduleBuilder = Test.createTestingModule({
      imports: [TestAppModule],
    })
      .overrideGuard(AccessTokenGuard)
      .useValue(new TestAccessTokenGuard());

    const moduleRef = await moduleBuilder.compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter()
    );
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      })
    );
    setupSwagger(app);

    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('exposes Swagger JSON with Russian metadata', async () => {
    const result = await app.inject({
      method: 'GET',
      url: '/docs-json',
    });

    expect(result.statusCode).toBe(200);

    const document = JSON.parse(result.payload) as unknown as OpenAPIObject;
    const signinOperation = document.paths['/auth/signin']?.post;
    const profileOperation = document.paths['/profile/my']?.get;

    if (!signinOperation || !profileOperation) {
      throw new Error('Expected Swagger operations for signin and profile.');
    }

    expect(document.info.title).toBe('Документация API');
    expect(signinOperation.tags).toEqual(['Аутентификация']);
    expect(profileOperation.tags).toEqual(['Профиль']);
    expect(signinOperation.summary).toBe('Вход пользователя');
  });

  it('applies DTO validation on signin', async () => {
    const result = await app.inject({
      method: 'POST',
      url: '/auth/signin',
      payload: {
        login: 'testuser',
      },
    });

    expect(result.statusCode).toBe(400);
  });

  it('returns tokens on signin with a valid payload', async () => {
    const result = await app.inject({
      method: 'POST',
      url: '/auth/signin',
      payload: {
        login: 'testuser',
        password: 'StrongPassword123!',
      },
    });

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.payload)).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
  });

  it('rejects guarded profile access without authorization', async () => {
    const result = await app.inject({
      method: 'GET',
      url: '/profile/my',
    });

    expect(result.statusCode).toBe(401);
  });

  it('returns the current profile for authorized requests', async () => {
    const result = await app.inject({
      method: 'GET',
      url: '/profile/my',
      headers: {
        authorization: 'Bearer access-token',
      },
    });

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.payload)).toEqual({
      userId: testUserId,
      login: 'testuser',
      email: 'testuser@example.com',
      age: 28,
      description: 'Тестовое описание',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-02T00:00:00.000Z',
    });
  });
});
