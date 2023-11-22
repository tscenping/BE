import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@liaoliaots/nestjs-redis';
import { Redis } from 'ioredis';

@Injectable()
export class AppService {
	constructor(@InjectRedis() private readonly redis: Redis) {}

	async setRank(user_number: number) {
		const user_score = await this.redis.zscore('rank', `user:${user_number}`);

		if (user_score !== null) {
			await this.redis.zadd('rank', + user_score + 1, `user:${user_number}`);
		} else {
			// tmp
			console.log('User Not Found');
		}
	}

	async getRank() {
		const result = await this.redis.zrevrange('rank', 0, 10);
		return result;
	}
}
