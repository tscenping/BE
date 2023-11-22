import {
	BadRequestException,
	Inject,
	Injectable,
	Logger,
} from '@nestjs/common';
import { DBUpdateFailureException } from '../common/exception/custom-exception';
import { GameRepository } from '../game/game.repository';
import { BlocksRepository } from './blocks.repository';
import { FriendsRepository } from './friends.repository';
import { UsersRepository } from './users.repository';
import { UserProfileResponseDto } from './dto/user-profile.dto';
import userConfig from '../config/user.config';
import { ConfigType } from '@nestjs/config';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
	private readonly nicknamePrefix: string;
	constructor(
		private readonly userRepository: UsersRepository,
		private readonly gameRepository: GameRepository,
		private readonly friendsRepository: FriendsRepository,
		private readonly blocksRepository: BlocksRepository,
		@Inject(userConfig.KEY)
		private readonly userConfigure: ConfigType<typeof userConfig>,
	) {
		this.nicknamePrefix = this.userConfigure.FIRST_NICKNAME_PREFIX;
	}

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

	async signup(userId: number, nickname: string, avatar: string) {
		const user = await this.validateUserExist(userId);

		await this.validateUserAlreadySignUp(user);

		await this.validateNickname(nickname);

		const updateRes = await this.userRepository.update(userId, {
			avatar: avatar,
			nickname: nickname,
		});

		if (updateRes.affected !== 1) {
			throw DBUpdateFailureException(UsersService.name);
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
		if (user.avatar && user.nickname)
			throw new BadRequestException(`${user.id} is already signed up`);
	}

	async validateNickname(nickname: string) {
		const user = await this.userRepository.findOneByNickname(nickname);

		if (user)
			throw new BadRequestException(
				`nickname '${nickname}' is already exist! Try again`,
			);
	}
}
