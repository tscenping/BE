import { InjectRedis } from '@liaoliaots/nestjs-redis';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Redis } from 'ioredis';
import { AppService } from 'src/app.service';
import { UsersRepository } from 'src/users/users.repository';
import { RankUserResponseDto } from './dto/rank-user-response.dto';
import { RankUserReturnDto } from './dto/rank-user-return.dto';
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
		// page 를 가지고 몇 위부터 몇 위까지 조회해야하는지 계산
		// 예를 들어 51~60위를 조회하고 싶다면
		// redis에서 50~60위까지 조회한 뒤, 51~60위만 반환
		// userID 배열을 가지고 유저 정보를 조회
		// 유저 정보에 ranking 프로퍼티를 추가 ( redis에서 조회한 ranking을 넣어줌)

		const rankUsers: RankUserReturnDto[] = foundUsers.map(
			(user, index) => ({
				...user,
				ranking: index + 1,
			}),
		);
		const totalItemCount = await this.userRepository.count(); // TODO: redis에 저장된 총 유저 수를 가져와야 하지 않을까?

		return { rankUsers, totalItemCount };
	}

	@Cron(CronExpression.EVERY_MINUTE)
	async handleCron() {
		const users = await this.userRepository.find();
		for (const user of users) {
			Logger.log(`updateRanking: ${user.ladderScore}, ${user.id}`);
			await this.AppService.updateRanking(user.ladderScore, user.id);
		}
	}
}
