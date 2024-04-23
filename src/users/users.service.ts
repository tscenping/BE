import {
	BadRequestException,
	Inject,
	Injectable,
	InternalServerErrorException,
	Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { DBUpdateFailureException } from '../common/exception/custom-exception';
import { GameRepository } from '../game/game.repository';
import { BlocksRepository } from '../friends/blocks.repository';
import { UserProfileResponseDto } from './dto/user-profile-response.dto';
import { FriendsRepository } from '../friends/friends.repository';
import { UsersRepository } from '../user-repository/users.repository';
import s3Config from '../config/s3.config';
import { ConfigType } from '@nestjs/config';
import {
	DeleteObjectCommand,
	PutObjectCommand,
	S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class UsersService {
	private readonly s3: S3Client;

	constructor(
		private readonly userRepository: UsersRepository,
		private readonly gameRepository: GameRepository,
		private readonly friendsRepository: FriendsRepository,
		private readonly blocksRepository: BlocksRepository,
		@Inject(s3Config.KEY)
		private readonly s3Configure: ConfigType<typeof s3Config>,
	) {
		this.s3 = this.s3Configure.S3Object;
	}

	private readonly logger = new Logger(UsersService.name);

	async findGameHistoriesWithPage(nickname: string, page: number) {
		// 유저 id 조회
		const targetUser = await this.userRepository.findUserByNickname(
			nickname,
		);
		if (!targetUser) {
			throw new BadRequestException(
				`there is no user with nickname ${nickname}`,
			);
		}

		// 게임 전적 조회
		const gameHistories =
			await this.gameRepository.findGameHistoriesWithPage(
				targetUser.id,
				page,
			);

		// 페이지 정보 조회
		const totalItemCount = await this.gameRepository.count({
			where: [{ winnerId: targetUser.id }, { loserId: targetUser.id }],
		});

		return {
			gameHistories,
			totalItemCount,
		};
	}

	async findMyProfile(userId: number) {
		const myProfile = await this.userRepository.findMyProfile(userId);

		return myProfile;
	}

	async findUserProfile(
		userId: number,
		targetUserNickname: string,
	): Promise<UserProfileResponseDto> {
		const userProfile = await this.userRepository.findUserProfileByNickname(
			targetUserNickname,
		);

		const friend = await this.friendsRepository.findFriend(
			userId,
			userProfile.id,
		);

		const block = await this.blocksRepository.findBlock(
			userId,
			userProfile.id,
		);

		return {
			...userProfile,
			isFriend: friend !== null,
			isBlocked: block !== null,
		};
	}

	async updateMyStatusMessage(userId: number, statusMessage: string | null) {
		const updateRes = await this.userRepository.update(userId, {
			statusMessage: statusMessage,
		});

		if (updateRes.affected !== 1) {
			throw DBUpdateFailureException(`user ${userId} update failed`);
		}
	}

	async updateMyAvatar(userId: number, avatar: string) {
		const updateRes = await this.userRepository.update(userId, {
			avatar: avatar,
		});

		if (updateRes.affected !== 1) {
			throw DBUpdateFailureException(`user ${userId} update failed`);
		}
	}

	async getUserIfRefreshTokenMatches(refreshToken: string, userId: number) {
		const user = await this.userRepository.findOne({
			where: { id: userId },
		});

		if (!user) {
			return null;
		}

		const isRefreshTokenMatching = await bcrypt.compare(
			refreshToken,
			user.refreshToken!,
		);

		if (!isRefreshTokenMatching) {
			return null;
		}

		return user;
	}

	async findRanksWithPage() {
		return await this.userRepository.findRanksWithPage();
	}

	async getPresignedUrl(userId: number) {
		// TODO: 수정 72시간 이내에는 에러

		const command = new PutObjectCommand({
			Bucket: this.s3Configure.S3_BUCKET_NAME,
			Key: `images/${userId}.jpeg`,
			ContentType: 'image/jpeg',
		});
		return await getSignedUrl(this.s3, command, { expiresIn: 3000 });
	}

	async deleteS3Image(userId: number) {
		const command = new DeleteObjectCommand({
			Bucket: this.s3Configure.S3_BUCKET_NAME,
			Key: `images/${userId}.jpeg`,
		});

		const response = await this.s3.send(command);
		// TODO: s3 이미지 삭제에 실패했을 때?
		if (response.$metadata.httpStatusCode !== 200) {
			console.error(response.$metadata.httpStatusCode);
			// throw new InternalServerErrorException();
		}
	}
}
