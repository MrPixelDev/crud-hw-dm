import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { UsersService } from 'src/users/users.service';
import {
  DataSource,
  EntityManager,
  QueryFailedError,
  Repository,
} from 'typeorm';
import { SessionEntity } from './entities/session.entity';
import {
  IAccessTokenPayload,
  IAuthenticatedUser,
  IRefreshTokenPayload,
  ITokenPair,
} from 'src/common/interfaces/auth.interface';
import { randomUUID, UUID } from 'crypto';
import { parseDurationToMs } from 'src/common/utilities/dt.utility';
import {
  ChangePasswordDto,
  RefreshTokenDto,
  SigninDto,
  SignupDto,
} from './dto/auth.dto';
import * as argon2 from 'argon2';

@Injectable()
export class AuthService {
  private static readonly _PG_UQ_VIOLATION = '23505';
  constructor(
    private readonly _jwtSvc: JwtService,
    private readonly _configSvc: ConfigService,
    private readonly _dataSrc: DataSource,
    @InjectRepository(SessionEntity)
    private readonly _sessionsRepo: Repository<SessionEntity>,
    private readonly _usersSvc: UsersService
  ) {}

  private _getRepo(manager?: EntityManager): Repository<SessionEntity> {
    return manager ? manager.getRepository(SessionEntity) : this._sessionsRepo;
  }

  private async _signToken(
    payload: IAccessTokenPayload | IRefreshTokenPayload,
    options: JwtSignOptions
  ): Promise<string> {
    return await this._jwtSvc.signAsync(payload, options);
  }

  private async _issueTokenPair(
    user: IAuthenticatedUser,
    sessionId: number,
    refreshJti: string
  ): Promise<ITokenPair> {
    const accessPayload: IAccessTokenPayload = {
      sub: user.userId,
      login: user.login,
      type: 'access',
    };

    const refreshPayload: IRefreshTokenPayload = {
      sub: user.userId,
      sid: sessionId,
      jti: refreshJti,
      type: 'refresh',
    };

    const [accessToken, refreshToken] = await Promise.all([
      this._signToken(accessPayload, {
        secret: this._configSvc.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: this._configSvc.get('JWT_ACCESS_EXPIRES_IN') || '3m',
      }),
      this._signToken(refreshPayload, {
        secret: this._configSvc.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this._configSvc.get('JWT_REFRESH_EXPIRES_IN') || '3m',
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  private _buildRefreshTokenExpiresAt(): Date {
    const expiresIn =
      this._configSvc.get<string>('JWT_REFRESH_EXPIRES_IN') || '3m';
    const ttlMs = parseDurationToMs(expiresIn);

    return new Date(Date.now() + ttlMs);
  }

  private async _createSessionAndIssueTokens(
    user: IAuthenticatedUser,
    manager: EntityManager
  ): Promise<ITokenPair> {
    const refreshJti = randomUUID();
    const sessionRepo = this._getRepo(manager);

    const session = sessionRepo.create({
      userId: user.userId,
      refreshJti: refreshJti,
      expiresAt: this._buildRefreshTokenExpiresAt(),
      revokedAt: null,
    });

    await sessionRepo.save(session);

    return await this._issueTokenPair(user, session.id, refreshJti);
  }

  private async _validateUser(
    login: string,
    plainPassword: string
  ): Promise<IAuthenticatedUser> {
    const user = await this._usersSvc.findByLoginWithPasswordHash(login);
    if (!user) {
      throw new UnauthorizedException('Invalid login or password');
    }

    if (user.deletedAt) {
      throw new UnauthorizedException('User has been deleted.');
    }

    const isPasswordValid = await argon2.verify(
      user.passwordHash,
      plainPassword
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid login or password');
    }

    return {
      userId: user.userId,
      login: user.login,
    };
  }

  private async _verifyRefreshToken(
    refreshToken: string
  ): Promise<IRefreshTokenPayload> {
    try {
      const payload = await this._jwtSvc.verifyAsync<IRefreshTokenPayload>(
        refreshToken,
        {
          secret: this._configSvc.get<string>('JWT_REFRESH_SECRET'),
        }
      );
      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  private _rethrowKnownDbErrors(e: unknown): void {
    const driverError = (
      e as {
        driverError?: {
          code?: string;
          constraint?: string;
        };
      }
    )?.driverError;

    if (
      e instanceof QueryFailedError &&
      driverError?.code === AuthService._PG_UQ_VIOLATION
    ) {
      switch (driverError.constraint) {
        case 'UQ_users_login':
          throw new ConflictException('Login is already in use');
        case 'UQ_users_email':
          throw new ConflictException('Login is already in use');
        default:
          throw new ConflictException('User already exists');
      }
    }
  }

  async signup(signupDto: SignupDto): Promise<ITokenPair> {
    const passwordHash = await argon2.hash(signupDto.password);

    try {
      return await this._dataSrc.transaction(async manager => {
        const existingEmail = await this._usersSvc.findByEmail(
          signupDto.email,
          manager
        );
        if (existingEmail) {
          throw new ConflictException('Email is already in use');
        }

        const user = await this._usersSvc.create(
          {
            login: signupDto.login,
            email: signupDto.email,
            passwordHash,
            age: signupDto.age,
            description: signupDto.description,
          },
          manager
        );

        return await this._createSessionAndIssueTokens(
          {
            userId: user.userId,
            login: user.login,
          },
          manager
        );
      });
    } catch (e) {
      this._rethrowKnownDbErrors(e);
      throw e;
    }
  }

  async signin(signinDto: SigninDto): Promise<ITokenPair> {
    const user = await this._validateUser(signinDto.login, signinDto.password);

    return await this._dataSrc.transaction(async manager => {
      return await this._createSessionAndIssueTokens(user, manager);
    });
  }

  async refresh(refreshTokenDto: RefreshTokenDto): Promise<ITokenPair> {
    const payload = await this._verifyRefreshToken(
      refreshTokenDto.refreshToken
    );
    return await this._dataSrc.transaction(async manager => {
      const sessionRepo = this._getRepo(manager);
      const session = await sessionRepo.findOneBy({
        id: payload.sid,
      });
      if (!(session && session.userId === payload.sub)) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      if (session.revokedAt) {
        throw new UnauthorizedException('Session has been revoked');
      }

      if (session.expiresAt.getTime() <= Date.now()) {
        throw new UnauthorizedException('Refresh token has been expired');
      }

      if (session.refreshJti !== payload.jti) {
        session.revokedAt = new Date();
        await sessionRepo.save(session);

        throw new UnauthorizedException('Refresh token reuse detected');
      }

      const user = await this._usersSvc.findByUserId(session.userId, manager);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const nextRefreshJti = randomUUID();

      session.refreshJti = nextRefreshJti;
      session.expiresAt = this._buildRefreshTokenExpiresAt();

      await sessionRepo.save(session);

      return await this._issueTokenPair(
        {
          userId: user.userId,
          login: user.login,
        },
        session.id,
        nextRefreshJti
      );
    });
  }

  async changePassword(
    login: string,
    newPasswordDto: ChangePasswordDto
  ): Promise<ITokenPair | void> {
    await this._validateUser(login, newPasswordDto.password);

    try {
      return await this._dataSrc.transaction(async manager => {
        const user = await this._usersSvc.findByLoginWithPasswordHash(
          login,
          manager
        );

        if (!user) {
          throw new NotFoundException('User not found');
        }

        const newPasswordHash = await argon2.hash(newPasswordDto.newPassword);
        user.passwordHash = newPasswordHash;

        await manager.save(user);

        return await this._createSessionAndIssueTokens(user, manager);
      });
    } catch (e) {
      this._rethrowKnownDbErrors(e);
      throw e;
    }
  }

  async signout(userId: UUID): Promise<void> {
    await this._getRepo()
      .createQueryBuilder()
      .update()
      .set({ revokedAt: new Date() })
      .where('user_id = :userId AND revoked_at IS NULL', { userId })
      .execute();
  }
}
