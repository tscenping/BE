import { InjectRedis } from '@liaoliaots/nestjs-redis';
import { Redis } from 'ioredis';
import { MUTE_TIME } from 'src/common/constants';

export class RedisRepository {
	constructor(@InjectRedis() private readonly redis: Redis) {}

	async getRanking(key: string, page: number) {
		const userRanking = await this.redis.zrange(
			key,
			(page - 1) * 10,
			page * 10 - 1,
		);

		return userRanking;
	}

	async setMuteUser(
		receiverUserIdKey: string,
		giverUserId: number,
		channelId: number,
	) {
		// check if user is already muted
		const isMuted = await this.redis.hget(
			receiverUserIdKey,
			giverUserId.toString(),
		);
		if (isMuted) {
			return;
		}
		await this.redis.hset(receiverUserIdKey, giverUserId, channelId);
		await this.redis.expire(receiverUserIdKey, MUTE_TIME); // TODO: 30초로 변경
	}
}
