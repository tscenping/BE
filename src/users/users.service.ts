import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserStatus } from 'src/common/enum';
import { DBUpdateFailureException } from '../common/exception/custom-exception';
import { GameRepository } from '../game/game.repository';
import { BlocksRepository } from './blocks.repository';
import { UserProfileResponseDto } from './dto/user-profile.dto';
import { User } from './entities/user.entity';
import { FriendsRepository } from './friends.repository';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
	constructor(
		private readonly userRepository: UsersRepository,
		private readonly gameRepository: GameRepository,
		private readonly friendsRepository: FriendsRepository,
		private readonly blocksRepository: BlocksRepository,
	) {}

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

	async signup(userId: number, nickname: string, avatar: string) {
		const user = await this.validateUserExist(userId);

		await this.validateUserAlreadySignUp(user);

		await this.validateNickname(nickname);

		const updateRes = await this.userRepository.update(userId, {
			avatar: avatar,
			nickname: nickname,
			status: UserStatus.ONLINE,
		});

		if (updateRes.affected !== 1) {
			throw DBUpdateFailureException(`user ${userId} update failed`);
		}
	}

	async validateUserExist(userId: number) {
		const user = await this.userRepository.findOne({
			where: {
				id: userId,
			},
		});

		if (!user) {
			throw new BadRequestException(
				`User with id ${userId} doesn't exist`,
			);
		}
		return user;
	}

	async validateUserAlreadySignUp(user: User) {
		if (user.nickname)
			throw new BadRequestException(`${user.id} is already signed up`);
	}

	async validateNickname(nickname: string) {
		const user = await this.userRepository.findUserByNickname(nickname);

		if (user)
			throw new BadRequestException(
				`nickname '${nickname}' is already exist! Try again`,
			);
	}

	async signout(userId: number) {
		await this.userRepository.update(userId, {
			refreshToken: null,
			status: UserStatus.OFFLINE,
		});
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

	// TODO: test용 메서드. 추후 삭제
	async findUserByNickname(nickname: string) {
		const user = await this.userRepository.findOne({
			where: { nickname },
		});

		return user;
	}

	// TODO: test용 메서드. 추후 삭제
	async createUser(nickname: string, email: string) {
		const user = this.userRepository.create({
			nickname,
			email,
		});

		await this.userRepository.save(user);

		return user;
	}
}
