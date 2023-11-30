import { BadRequestException, Injectable } from '@nestjs/common';
import { GameRepository } from './game.repository';
import { UsersRepository } from '../users/users.repository';
import { GameType, UserStatus } from '../common/enum';
import { GameInvitationRepository } from './game-invitation.repository';
import { DBUpdateFailureException } from '../common/exception/custom-exception';

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
		// 본인 스스로인지
		if (invitingUserId == invitedUserId)
			throw new BadRequestException(`Could not invite yourself`);

		// 상대가 존재하는 유저인지
		const user = await this.userRepository.findOne({
			where: {
				id: invitedUserId,
			},
		});
		if (!user) {
			throw new BadRequestException(
				`user with id ${invitedUserId} doesn't exist`,
			);
		}

		// 상대가 접속 중인지 => 접속 중인 유저가 아니라면 없던 일이 됨 (프롱트에 에러 주기?)
		if (user.status === UserStatus.OFFLINE)
			throw new BadRequestException('Invited user is now offline'); // 다른 에러코드 없나

		// db 저장
		const gameInvitation = this.gameInvitationRepository.create({
			invitingUserId,
			invitedUserId,
			gameType,
		});
		const result = await this.gameInvitationRepository.save(gameInvitation);
		if (!result)
			throw DBUpdateFailureException('create game invitation failed');
		// TODO: 알림 보내기, 게임 소켓 연결 gateway 만들기
	}
}
