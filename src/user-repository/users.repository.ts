import { InjectRedis } from '@liaoliaots/nestjs-redis';
import {
	BadRequestException,
	ForbiddenException,
	Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Redis from 'ioredis';
import { UserStatus } from 'src/common/enum';
import { DataSource, Repository } from 'typeorm';
import { MyProfileResponseDto } from './dto/my-profile-response.dto';
import { UserProfileReturnDto } from './dto/user-profile-return.dto';
import { User } from './entities/user.entity';
import { RankUserReturnDto } from '../users/dto/rank-user-return.dto';
import s3Config from '../config/s3.config';
import { ConfigType } from '@nestjs/config';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
	S3_OBJECT_CONTENTTYPE,
	S3_OBJECT_KEY_PREFIX,
	S3_OBJECT_KEY_SUFFIX,
	S3_IMAGE_URL_PREFIX,
} from '../common/constants';

export class UsersRepository extends Repository<User> {
	constructor(
		@InjectRepository(User) private dataSource: DataSource,
		@InjectRedis() private readonly redis: Redis,
		@Inject(s3Config.KEY)
		private readonly s3Configure: ConfigType<typeof s3Config>,
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

	// TODO: test용 메서드. 추후 삭제
	async createUser(nickname: string, email: string) {
		const user = this.create({
			nickname,
			email,
		});

		await this.save(user);

		return user;
	}

	async findRanksWithPage() {
		const startTime = new Date().getTime();
		const userRanking = await this.dataSource.query(
			`
			SELECT u.id
			FROM public.user u
			WHERE u."deletedAt" IS NULL AND u.nickname IS NOT NULL
			ORDER BY u."ladderScore" DESC
			`,
		);
		const endTime = new Date().getTime();
		console.log(`Time: ${endTime - startTime} ms`);

		const foundUsers = await this.findRanksInfos(
			userRanking.map((user: { id: number }) => user.id),
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

	async getAvatarAndPresignedUrl(nickname: string) {
		const date = this.getNowDate();
		const key = `${S3_OBJECT_KEY_PREFIX}/${nickname}${date}${S3_OBJECT_KEY_SUFFIX}`;
		const preSignedUrl = await this.getPresignedUrl(key);
		return {
			avatar: `${S3_IMAGE_URL_PREFIX}/${key}`,
			preSignedUrl: preSignedUrl,
		};
	}

	private async getPresignedUrl(key: string) {
		const command = new PutObjectCommand({
			Bucket: this.s3Configure.S3_BUCKET_NAME,
			Key: key,
			ContentType: S3_OBJECT_CONTENTTYPE,
		});
		return await getSignedUrl(this.s3Configure.S3Object, command, {
			expiresIn: 180, //초 단위
		});
	}

	private getNowDate(): string {
		const date = new Date();
		const year = date.getFullYear().toString();
		const month = (date.getMonth() + 1).toString().padStart(2, '0'); // 월은 0부터 시작하므로 +1을 해줌
		const day = date.getDate().toString().padStart(2, '0');

		return `${year}${month}${day}`;
	}
}
