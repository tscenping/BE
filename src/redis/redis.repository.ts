import { InjectRedis } from '@liaoliaots/nestjs-redis';
import { Redis } from 'ioredis';
import { MUTE_TIME } from 'src/common/constants';
import { CreateMuteParamDto } from './../channels/dto/create-mute-param.dto';

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

	async setMuteUser(createMuteParamDto: CreateMuteParamDto) {
		const { channelId, receiverUserId, giverUserId } = createMuteParamDto;
		// await this.redis.set(`mute:${channelId}:${receiverUserIdKey}:1`, '');
		// await this.redis.set(`mute:${channelId}:${receiverUserIdKey}:2`, '');
		// await this.redis.expire(receiverUserIdKey, MUTE_TIME); // TODO: 30초로 변경
		// const key = `mute:${channelId}:${receiverUserIdKey}:\*`;
		// const Mutelist = await this.redis.keys(key);
		// console.log('Mutelist: ', Mutelist);
		const muteKey = `mute:${channelId}:${receiverUserId}:${giverUserId}`;
		// redis에 mute 정보 저장
		const result = await this.redis.set(muteKey, '');
		// mute 정보 만료 시간 설정
		await this.redis.expire(muteKey, MUTE_TIME); // TODO: 30초로 변경
		console.log('result: ', result);
	}
}
