import { Injectable, Logger } from '@nestjs/common';

export abstract class CacheAdapter {
  abstract get<T>(key: string): Promise<T | null>;
  abstract set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  abstract del(key: string): Promise<void>;
}

@Injectable()
export class InMemoryCacheAdapter implements CacheAdapter {
  private readonly store = new Map<string, { value: any; expiresAt: number }>();
  private readonly logger = new Logger('CacheAdapter');

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds: number = 300): Promise<void> {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.store.set(key, { value, expiresAt });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }
}
