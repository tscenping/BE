import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@liaoliaots/nestjs-redis';
import { Redis } from 'ioredis';

@Injectable()
export class AppService {
	constructor(@InjectRedis() private readonly redis: Redis) {}

	// push data to redis using zadd
	async updateRanking(id: number, score: number) {
		await this.redis.zadd('rankings', score, `user:${id}`);
	}
}
