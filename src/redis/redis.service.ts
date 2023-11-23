import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@liaoliaots/nestjs-redis';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService {
  constructor(@InjectRedis() private readonly redis: Redis) {}
  async getTwenty() {
    const redisTwentyData = await this.redis.zrange('rank', 0, -1, 'WITHSCORES');
    const topTwenty = redisTwentyData.slice(0, 20);

    return topTwenty;
  }

  async findOneById(id: number) {
    const redisOneData = await this.redis.zscore('rank', `user:${id}`);
    return redisOneData;
  }
}
