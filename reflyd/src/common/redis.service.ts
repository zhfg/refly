import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService extends Redis implements OnModuleInit {
  private readonly logger = new Logger(RedisService.name);

  constructor(private configService: ConfigService) {
    super({
      host: configService.getOrThrow('redis.host'),
      port: configService.getOrThrow('redis.port'),
    });
  }

  async onModuleInit() {
    if (!(await this.ping())) {
      throw new Error('Redis connection failed');
    }
    this.logger.log('Redis connection established');
  }

  async acquireLock(key: string) {
    try {
      const token = `${process.pid}-${Date.now()}`;
      const success = await this.set(key, token, 'EX', 10, 'NX');

      if (success) {
        return async () => await this.releaseLock(key, token);
      } else {
        return null;
      }
    } catch (err) {
      this.logger.warn('Error acquiring lock:', err);
      return null;
    }
  }

  async releaseLock(key: string, token: string) {
    try {
      const script = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("del", KEYS[1])
        else
          return 0
        end
      `;

      const success = await this.eval(script, 1, key, token);

      if (success === 1) {
        return true;
      } else {
        return false;
      }
    } catch (err) {
      this.logger.error('Error releasing lock:', err);
      throw false;
    }
  }
}
