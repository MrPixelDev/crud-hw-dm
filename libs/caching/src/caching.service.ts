import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';

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
