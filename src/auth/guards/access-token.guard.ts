import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';
import {
  IAccessTokenPayload,
  RequestWithUser,
} from 'src/common/interfaces/auth.interface';

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private readonly _jwtSvc: JwtService,
    private readonly _configSvc: ConfigService
  ) {}

  private _getRequiredEnv(name: string): string {
    const value = this._configSvc.get<string>(name);

    if (!value) {
      throw new Error(`${name} is not set`);
    }

    return value;
  }

  private _extractTokenFromHeader(req: RequestWithUser): string | undefined {
    const [type, token] = req.headers?.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  canActivate(
    context: ExecutionContext
  ): boolean | Promise<boolean> | Observable<boolean> {
    const req = context.switchToHttp().getRequest<RequestWithUser>();
    const token = this._extractTokenFromHeader(req);

    if (!token) {
      throw new UnauthorizedException();
    }

    return this._jwtSvc
      .verifyAsync<IAccessTokenPayload>(token, {
        secret: this._getRequiredEnv('JWT_ACCESS_SECRET'),
      })
      .then(payload => {
        if (payload.type !== 'access') {
          throw new UnauthorizedException('Invalid token type');
        }

        req.user = payload;
        return true;
      })
      .catch(() => {
        throw new UnauthorizedException();
      });
  }
}
