import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@liaoliaots/nestjs-redis';
import { Redis } from 'ioredis';
import { Logger } from '@nestjs/common';
@Injectable()
export class AppService {
	constructor(@InjectRedis() private readonly redis: Redis) {}

	// push data to redis using zadd
	async updateRanking(score: number, id: number) {
		// Logger.log(`Redis updateRanking: ${score}, ${id}`);
		await this.redis.zadd('rankings', score, id);
	}
}
