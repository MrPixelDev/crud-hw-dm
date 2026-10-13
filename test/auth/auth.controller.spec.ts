import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { AuthController } from 'src/auth/auth.controller';
import type { AuthService } from 'src/auth/auth.service';
import {
  ChangePasswordDto,
  RefreshTokenDto,
  SigninDto,
  SignupDto,
} from 'src/auth/dto/auth.dto';

describe('AuthController', () => {
  const userId = crypto.randomUUID();

  const authServiceMock = {
    signup: jest.fn<AuthService['signup']>(),
    signin: jest.fn<AuthService['signin']>(),
    refresh: jest.fn<AuthService['refresh']>(),
    changePassword: jest.fn<AuthService['changePassword']>(),
    signout: jest.fn<AuthService['signout']>(),
  } satisfies Pick<
    AuthService,
    'signup' | 'signin' | 'refresh' | 'changePassword' | 'signout'
  >;

  let controller: AuthController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new AuthController(authServiceMock as never);
  });

  it('delegates signup to AuthService', async () => {
    const dto: SignupDto = {
      login: 'testuser',
      email: 'testuser@example.com',
      password: 'StrongPassword123!',
      age: 28,
      description: 'Тестовое описание',
    };
    const tokens = { accessToken: 'access', refreshToken: 'refresh' };

    authServiceMock.signup.mockResolvedValue(tokens);

    await expect(controller.signup(dto)).resolves.toEqual(tokens);
    expect(authServiceMock.signup).toHaveBeenCalledWith(dto);
  });

  it('delegates signin to AuthService', async () => {
    const dto: SigninDto = {
      login: 'testuser',
      password: 'StrongPassword123!',
    };
    const tokens = { accessToken: 'access', refreshToken: 'refresh' };

    authServiceMock.signin.mockResolvedValue(tokens);

    await expect(controller.signin(dto)).resolves.toEqual(tokens);
    expect(authServiceMock.signin).toHaveBeenCalledWith(dto);
  });

  it('delegates refresh to AuthService', async () => {
    const dto: RefreshTokenDto = {
      refreshToken: 'refresh-token',
    };
    const tokens = { accessToken: 'access', refreshToken: 'refresh' };

    authServiceMock.refresh.mockResolvedValue(tokens);

    await expect(controller.refresh(dto)).resolves.toEqual(tokens);
    expect(authServiceMock.refresh).toHaveBeenCalledWith(dto);
  });

  it('delegates changePassword to AuthService using the current login', async () => {
    const dto: ChangePasswordDto = {
      password: 'StrongPassword123!',
      newPassword: 'NewStrongPassword456!',
    };
    const tokens = { accessToken: 'access', refreshToken: 'refresh' };

    authServiceMock.changePassword.mockResolvedValue(tokens);

    await expect(controller.changePassword('testuser', dto)).resolves.toEqual(
      tokens
    );
    expect(authServiceMock.changePassword).toHaveBeenCalledWith(
      'testuser',
      dto
    );
  });

  it('delegates signout to AuthService using the current user id', async () => {
    authServiceMock.signout.mockResolvedValue(undefined);

    await expect(controller.signout(userId)).resolves.toBeUndefined();
    expect(authServiceMock.signout).toHaveBeenCalledWith(userId);
  });
});
