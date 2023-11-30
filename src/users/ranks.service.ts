import { UsersRepository } from 'src/users/users.repository';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRedis } from '@liaoliaots/nestjs-redis';
import { Redis } from 'ioredis';
import { RankUserResponseDto } from './dto/rank-user-response.dto';
import { RankUserReturnDto } from './dto/rank-user-return.dto';

@Injectable()
export class RanksService {
	constructor(
		@InjectRedis() private readonly redis: Redis,
		private readonly userRepository: UsersRepository,
	) {}

	async findRanksWithPage(page: number): Promise<RankUserResponseDto> {
		//userIDRanking: [userId, userId, userId, ...]
		const userRanking: string[] = await this.redis.zrange(
			'rankings',
			(page - 1) * 10,
			page * 10 - 1,
		);
		if (!userRanking) {
			throw new BadRequestException(`unavailable ranking property`);
		}
		console.log('userRanking: ', userRanking); // dbg

		const foundUsers = await this.userRepository.findRanksInfos(
			userRanking,
		);
		// page 를 가지고 몇 위부터 몇 위까지 조회해야하는지 계산
		// 예를 들어 51~60위를 조회하고 싶다면
		// redis에서 50~60위까지 조회한 뒤, 51~60위만 반환
		// userID 배열을 가지고 유저 정보를 조회
		// 유저 정보에 ranking 프로퍼티를 추가 ( redis에서 조회한 ranking을 넣어줌)

		const rankUsers: RankUserReturnDto[] = foundUsers.map((user) => ({
			...user,
			ranking: Number(userRanking),
		}));
		const totalItemCount = await this.userRepository.count(); // TODO: redis에 저장된 총 유저 수를 가져와야 하지 않을까?

		return { rankUsers, totalItemCount };
	}
}
