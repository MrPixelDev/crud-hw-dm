import { UUID } from 'crypto';

export interface IAuthenticatedUser {
  userId: UUID;
  login: string;
}

export interface IAccessTokenPayload {
  sub: UUID;
  login: string;
  type: 'access';
}

export interface IRefreshTokenPayload {
  sub: UUID;
  sid: number;
  jti: string;
  type: 'refresh';
}

export interface ITokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface ISignupParams {
  login: string;
  email: string;
  passwordHash: string;
  age: number;
  description: string;
}

export type RequestWithUser = Request & {
  headers?: {
    authorization?: string;
    [key: string]: string | string[] | undefined;
  };
  user?: IAccessTokenPayload;
};
