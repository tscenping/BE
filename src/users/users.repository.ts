import { InjectRedis } from '@liaoliaots/nestjs-redis';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Redis from 'ioredis';
import { UserStatus } from 'src/common/enum';
import { DataSource, Repository } from 'typeorm';
import { MyProfileResponseDto } from './dto/my-profile-response.dto';
import { UserProfileReturnDto } from './dto/user-profile.dto';
import { User } from './entities/user.entity';

export class UsersRepository extends Repository<User> {
	constructor(
		@InjectRepository(User) private dataSource: DataSource,
		@InjectRedis() private readonly redis: Redis,
	) {
		super(User, dataSource.manager);
	}

	async findUserByNickname(nickname: string) {
		return await this.findOne({ where: { nickname } });
	}

	async findMyProfile(userId: number): Promise<MyProfileResponseDto> {
		const myProfile = await this.findOne({
			select: [
				'id',
				'nickname',
				'avatar',
				'statusMessage',
				'loseCount',
				'winCount',
				'ladderScore',
				'ladderMaxScore',
			],
			where: { id: userId },
		});

		if (!myProfile) {
			throw new ForbiddenException('invalid user');
		}

		// redis에서 ladderRank 조회하기
		let ladderRank = await this.redis.zrevrank(
			'rankings',
			userId.toString(),
		);
		if (ladderRank !== null) {
			ladderRank += 1;
		}

		return {
			...myProfile,
			totalCount: myProfile.loseCount + myProfile.winCount,
			ladderRank,
		} as MyProfileResponseDto;
	}

	async findUserProfileByNickname(
		nickname: string,
	): Promise<UserProfileReturnDto> {
		const userProfile = await this.findOne({
			select: [
				'id',
				'nickname',
				'avatar',
				'statusMessage',
				'loseCount',
				'winCount',
				'ladderScore',
				'ladderMaxScore',
			],
			where: { nickname: nickname },
		});

		if (!userProfile) {
			throw new BadRequestException(
				`there is no user with nickname ${nickname}`,
			);
		}

		let ladderRank = await this.redis.zrevrank(
			'rankings',
			userProfile.id.toString(),
		);

		if (ladderRank !== null) {
			ladderRank += 1;
		}

		return {
			...userProfile,
			totalCount: userProfile.loseCount + userProfile.winCount,
			ladderRank,
		} as UserProfileReturnDto;
	}

	async findRanksInfos(users: string[]) {
		const rankUsers: User[] = [];
		// Use forEach to iterate through users array
		for (const userid of users) {
			const user = await this.findOne({
				select: ['nickname', 'avatar', 'ladderScore'],
				where: { id: parseInt(userid) },
			});
			if (!user) {
				throw new BadRequestException(`there is no user with id`);
			}
			rankUsers.push(user);
		}
		return rankUsers;
	}

	async initAllSocketIdAndUserStatus() {
		await this.createQueryBuilder()
			.update()
			.set({
				gameSocketId: null,
				channelSocketId: null,
				status: UserStatus.OFFLINE,
			})
			.execute();
	}
}
