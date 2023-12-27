import { InjectRedis } from '@liaoliaots/nestjs-redis';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Redis } from 'ioredis';
import { AppService } from 'src/app.service';
import { UsersRepository } from 'src/users/users.repository';
import { RankUserResponseDto } from './dto/rank-user-response.dto';
import { RankUserReturnDto } from './dto/rank-user-return.dto';
import { IsNull, Not } from 'typeorm';
@Injectable()
export class RanksService {
	constructor(
		private readonly userRepository: UsersRepository,
		private readonly AppService: AppService,
		@InjectRedis() private readonly redis: Redis,
	) {}

	async findRanksWithPage(): Promise<RankUserResponseDto> {
		//userIDRanking: [userId, userId, userId, ...]

		const userRanking = await this.redis.zrevrange('rankings', 0, -1);

		const foundUsers = await this.userRepository.findRanksInfos(
			userRanking,
		);

		const rankUsers: RankUserReturnDto[] = foundUsers.map(
			(user, index) => ({
				...user,
				ranking: index + 1,
			}),
		);
		const totalItemCount = userRanking.length;

		return { rankUsers, totalItemCount };
	}

	@Cron(CronExpression.EVERY_MINUTE)
	async handleCron() {
		const users = await this.userRepository.find(
			// user중 nickname이 없는 유저는 랭킹에 올라가지 않는다.
			{ where: { nickname: Not(IsNull()) } },
		);
		console.log(users);
		for (const user of users) {
			Logger.log(`updateRanking: ${user.ladderScore}, ${user.id}`);
			await this.AppService.updateRanking(user.ladderScore, user.id);
		}
	}
}
