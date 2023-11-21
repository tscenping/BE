import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { DBUpdateFailureException } from '../common/exception/custom-exception';
import { GameRepository } from './../game/game.repository';
import { BlocksRepository } from './blocks.repository';
import { LoginRequestDto } from './dto/login-request.dto';
import { FriendsRepository } from './friends.repository';
import { UsersRepository } from './users.repository';
import { UserProfileResponseDto } from './dto/user-profile.dto';

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
		const targetUser = await this.userRepository.findOneByNickname(
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
	// TODO: test용 메서드. 추후 삭제
	async isNicknameExists(nickname: string) {
		const user = await this.userRepository.findOne({
			where: { nickname },
		});

		return !!user;
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

	async login(userId: number, loginRequestDto: LoginRequestDto) {
		const avatar = loginRequestDto.avatar;
		const nickname = loginRequestDto.nickname;

		const user = await this.userRepository.findOne({
			where: { id: userId },
		});
		if (!user) throw new BadRequestException(`there is no user`);

		const result = await this.userRepository.update(userId, {
			avatar: avatar,
			nickname: nickname,
		});

		if (result.affected !== 1) {
			throw DBUpdateFailureException(UsersService.name);
		}
	}
}
