import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { DBUpdateFailureException } from '../common/exception/custom-exception';
import { GameRepository } from '../game/game.repository';
import { BlocksRepository } from '../friends/blocks.repository';
import { UserProfileResponseDto } from './dto/user-profile-response.dto';
import { FriendsRepository } from '../friends/friends.repository';
import { UsersRepository } from '../user-repository/users.repository';

@Injectable()
export class UsersService {
	constructor(
		private readonly usersRepository: UsersRepository,
		private readonly gameRepository: GameRepository,
		private readonly friendsRepository: FriendsRepository,
		private readonly blocksRepository: BlocksRepository,
	) {}

	private readonly logger = new Logger(UsersService.name);

	async findGameHistoriesWithPage(nickname: string, page: number) {
		// 유저 id 조회
		const targetUser = await this.usersRepository.findUserByNickname(
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
		const myProfile = await this.usersRepository.findMyProfile(userId);

		return myProfile;
	}

	async findUserProfile(
		userId: number,
		targetUserNickname: string,
	): Promise<UserProfileResponseDto> {
		const userProfile =
			await this.usersRepository.findUserProfileByNickname(
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
		const updateRes = await this.usersRepository.update(userId, {
			statusMessage: statusMessage,
		});

		if (updateRes.affected !== 1) {
			throw DBUpdateFailureException(`user ${userId} update failed`);
		}
	}

	async updateMyAvatar(userId: number, nickname: string, hasAvatar: boolean) {
		/*
		TODO: 업데이트한지 3일 이내면 에러 던지기,
			현 db 상태와 같다면(avatar가 이미 null인데 hasAvatar = false 라면) update 진행 중지
		 */
		let ret;
		let updateUserDataDto;
		if (hasAvatar) {
			const { avatar, preSignedUrl } =
				await this.usersRepository.getAvatarAndPresignedUrl(nickname);
			updateUserDataDto = {
				avatar: avatar,
			};
			ret = preSignedUrl;
		} else {
			updateUserDataDto = {
				avatar: null,
			};
			ret = null;
		}

		// '결과가 즉각 반영될 필요 없으니 기다리지말고 비동기적으로 수행하도록 냅두자'라는 생각 -> await 키워드 뺌
		this.usersRepository.update(userId, {
			...updateUserDataDto,
		});

		// const updateRes = await this.usersRepository.update(userId, {
		// 	...updateUserDataDto,
		// });
		//
		// if (updateRes.affected !== 1) {
		// 	throw DBUpdateFailureException(`user ${userId} update failed`);
		// }

		return ret;
	}

	async getUserIfRefreshTokenMatches(refreshToken: string, userId: number) {
		const user = await this.usersRepository.findOne({
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
		return await this.usersRepository.findRanksWithPage();
	}
}
