import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  Inject,
  Injectable,
  Logger,
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

@Injectable()
export class Caching {
  private readonly _logger = new Logger(Caching.name);

  constructor(
    @Inject(CACHE_MANAGER)
    private readonly _cacheManager: Cache
  ) {}

  async getCachedValue<T>(key: string): Promise<T | null> {
    try {
      const value = await this._cacheManager.get<T>(key);

      if (value) {
        this._logger.debug(`Cached ${key} value found`);
      } else {
        this._logger.debug(`Cached ${key} value not found`);
      }

      return value ?? null;
    } catch (e) {
      this._logger.warn(
        `Cache error getting ${key}: ${e instanceof Error ? e.message : String(e)}`
      );
      return null;
    }
  }

  async setCachedValue<T>(key: string, value: T): Promise<void> {
    try {
      await this._cacheManager.set(key, value);
      this._logger.debug(`Cache ${key} was set`);
    } catch (e) {
      this._logger.warn(
        `Cache error setting ${key}: ${e instanceof Error ? e.message : String(e)}`
      );
      return;
    }
  }

  async deleteCachedValue(key: string): Promise<void> {
    try {
      await this._cacheManager.del(key);
      this._logger.debug(`Cache ${key} was deleted`);
    } catch (e) {
      this._logger.warn(
        `Cache error deleting ${key}: ${e instanceof Error ? e.message : String(e)}`
      );
      return;
    }
  }

  async mdel(keys: string[]): Promise<boolean> {
    return await this._cacheManager.mdel(keys);
  }
}
