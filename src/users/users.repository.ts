import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { MyProfileResponseDto } from './dto/my-profile-response.dto';
import { UserProfileReturnDto } from './dto/user-profile.dto';
import { User } from './entities/user.entity';

export class UsersRepository extends Repository<User> {
	constructor(@InjectRepository(User) private dataSource: DataSource) {
		super(User, dataSource.manager);
	}

	async findUserById(userId: number) {
		const user = await this.findOne({
			where: {
				id: userId,
			},
		});
		return user;
	}

	async findUserByNickname(nickname: string) {
		return await this.findOne({ where: { nickname } });
	}

	async findMyProfile(userId: number): Promise<MyProfileResponseDto> {
		const myProfile = await this.findOne({
			select: [
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

		return {
			...myProfile,
			totalCount: myProfile.loseCount + myProfile.winCount,
			ladderRank: 1, // TODO: ladderRank cache에서 조회하기
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

		return {
			...userProfile,
			totalCount: userProfile.loseCount + userProfile.winCount,
			ladderRank: 1, // TODO: ladderRank cache에서 조회하기,
		};
	}
}
