import { BadRequestException, Injectable } from '@nestjs/common';
import { GameRepository } from './game.repository';
import { UsersRepository } from '../users/users.repository';
import { GameType, UserStatus } from '../common/enum';
import { GameInvitationRepository } from './game-invitation.repository';

@Injectable()
export class GameService {
	constructor(
		private readonly gameRepository: GameRepository,
		private readonly gameInvitationRepository: GameInvitationRepository,
		private readonly userRepository: UsersRepository,
	) {}

	async createInvitation(
		invitingUserId: number,
		invitedUserId: number,
		gameType: GameType,
	) {
		// 선 예외 처리: 1. 본인 스스로인지, 2. 상대가 존재하는 유저인지
		if (invitingUserId == invitedUserId)
			throw new BadRequestException(`Could not invite yourself`);

		const user = await this.validateUserExists(invitedUserId);
		// 상대가 접속 중인지 확인 => 접속 중인 유저가 아니라면 없던 일이 됨 (프롱트에 에러 주기?)
		if (user.status === UserStatus.OFFLINE)
			throw new BadRequestException('Invited user is now offline'); // 다른 에러코드 없나
		// db 저장
		const gameInvitationDto = this.gameInvitationRepository.create({
			invitingUserId,
			invitedUserId,
			gameType,
		});
		await this.gameInvitationRepository.save(gameInvitationDto);
		// TODO: 알림 보내기, 게임 소켓 연결 gateway 만들기
	}

	async validateUserExists(userId: number) {
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
}
