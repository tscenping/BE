import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { GameRepository } from './../game/game.repository';
import { LoginRequestDto } from './dto/login-request.dto';
import { UserRepository } from './users.repository';
import { DBUpdateFailureException } from '../common/exception/custom-exception';

@Injectable()
export class UsersService {
	constructor(
		private readonly userRepository: UserRepository,
		private readonly gameRepository: GameRepository,
	) {}

	private readonly logger = new Logger(UsersService.name);

	async findGameHistoriesWithPage(nickname: string, page: number) {
		// 유저 id 조회
		const targetUser = await this.userRepository.findOneByNickname(
			nickname,
		);
		if (!targetUser) {
			throw new HttpException(
				`there is no user with nickname: ${nickname}`,
				HttpStatus.BAD_REQUEST,
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
			where: {
				loserId: targetUser.id,
			} || {
				winnerId: targetUser.id,
			},
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

	async login(userId: number, loginRequestDto: LoginRequestDto) {
		const avatar = loginRequestDto.avatar;
		const nickname = loginRequestDto.nickname;

		const user = await this.userRepository.findOne({
			where: { id: userId },
		});
		if (!user)
			throw new HttpException(`there is no user`, HttpStatus.BAD_REQUEST);

		const resault = await this.userRepository.update(userId, {
			avatar: avatar,
			nickname: nickname,
		});

		if (resault.affected !== 1) {
			throw DBUpdateFailureException(UsersService.name);
		}
	}
}
