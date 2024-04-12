import { InjectRedis } from '@liaoliaots/nestjs-redis';
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Redis } from 'ioredis';
import { AppService } from 'src/app.service';
import { UsersRepository } from 'src/user-repository/users.repository';
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

	async findRanksWithPage(page: number): Promise<RankUserResponseDto> {
		//userIDRanking: [userId, userId, userId, ...]
		// 시간 재기
		const startTime = new Date().getTime();
		const userRanking = await this.redis.zrevrange(
			'rankings',
			(page - 1) * 15,
			page * 15 - 1,
		);
		const endTime = new Date().getTime();
		console.log(`redis time: ${endTime - startTime}ms`);

		const foundUsers = await this.userRepository.findRanksInfos(
			userRanking,
		);

		const rankUsers: RankUserReturnDto[] = foundUsers.map(
			(user, index) => ({
				...user,
				ranking: index + 1 + (page - 1) * 15,
			}),
		);
		const totalItemCount = userRanking.length;
		return { rankUsers, totalItemCount };
	}

	@Cron(CronExpression.EVERY_MINUTE)
	async handleCron() {
		// console.log(users);
		// 모든 키 삭제
		await this.redis.del('rankings');
		await this.addRanking();
	}

	async addRanking() {
		const users = await this.userRepository.find(
			// user중 nickname이 없는 유저는 랭킹에 올라가지 않는다.
			{ where: { nickname: Not(IsNull()) } },
		);
		// // 모든 키 삭제
		// await this.redis.del('rankings'); // TODO: 전체 키를 삭제해야 하는지 고민 필요

		for (const user of users) {
			// Logger.log(`updateRanking: ${user.ladderScore}, ${user.id}`);
			await this.AppService.updateRanking(user.ladderScore, user.id);
		}
	}
}
