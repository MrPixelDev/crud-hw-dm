import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  Injectable,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

class Normalizers {
  static normalizeLogin = ({ value }: { value: unknown }): string => {
    if (typeof value !== 'string') {
      throw new BadRequestException('Login must be a string');
    }

    return value.trim();
  };

  static normalizeEmail = ({ value }: { value: unknown }): string => {
    if (typeof value !== 'string') {
      throw new BadRequestException('Email must be a string');
    }

    return value.toLowerCase();
  };
}

class Utilities {
  static parseDurationToMs = (value: string): number => {
    const match = /^(\d+)(s|m|h|d)$/.exec(value.trim());

    if (!match) {
      throw new Error(
        `Unsupported format: ${value}\n\nValue must be %number%%s|m|h|d%`
      );
    }

    const amount = +match[1];
    const unit = match[2];

    const multipliers: Record<string, number> = {
      s: 1_000,
      m: 60_000,
      h: 3_600_000,
      d: 86_400_000,
    };

    return amount * multipliers[unit];
  };
}

@Injectable()
export class HelpersService {
  static normalizeLogin = ({ value }: { value: unknown }): string => {
    return Normalizers.normalizeLogin({ value });
  };

  static normalizeEmail = ({ value }: { value: unknown }): string => {
    return Normalizers.normalizeEmail({ value });
  };

  static parseDurationToMs = (value: string): number => {
    return Utilities.parseDurationToMs(value);
  };
}

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly _httpAdapterHost: HttpAdapterHost) {}

  catch(exception: HttpException, host: ArgumentsHost) {
    const status = exception.getStatus();
    const responseBody = {
      statusCode: status,
      message: exception.message,
      timestamp: new Date().toISOString(),
    };

    this._httpAdapterHost.httpAdapter.reply(
      host.switchToHttp().getResponse(),
      responseBody,
      status
    );
  }
}
