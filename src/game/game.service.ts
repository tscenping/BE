import { BadRequestException, Injectable } from '@nestjs/common';
import { GameRepository } from './game.repository';
import { UsersRepository } from '../users/users.repository';
import { CreateGameInvitationParamDto } from './dto/create-invitation-param.dto';
import { GatewayCreateInvitationParamDto } from './dto/gateway-create-invitation-param.dto';
import { GameGateway } from './game.gateway';

@Injectable()
export class GameService {
	constructor(
		private readonly gameRepository: GameRepository,
		private readonly gameGateway: GameGateway,
		private readonly usersRepository: UsersRepository,
	) {}

	async createInvitation(invitationParamDto: CreateGameInvitationParamDto) {
		const invitingUser = invitationParamDto.invitingUser;
		const invitedUserId = invitationParamDto.invitedUserId;

		// 본인 스스로인지
		if (invitingUser.id == invitedUserId)
			throw new BadRequestException(`could not invite yourself`);

		// 상대가 존재하는 유저인지
		const invitedUser = await this.usersRepository.findOne({
			where: {
				id: invitedUserId,
			},
		});
		if (!invitedUser) {
			throw new BadRequestException(
				`user ${invitedUserId} does not exist`,
			);
		}

		// db 저장
		const gameInvitation = await this.gameRepository.createGameInvitation(
			invitationParamDto,
		);

		// TODO: 알림 보내기
		const gatewayInvitationParamDto: GatewayCreateInvitationParamDto = {
			invitationId: gameInvitation.id,
			invitingUserNickname: invitedUser.nickname,
			invitedUserId: invitedUserId,
			gameType: invitationParamDto.gameType,
		};
		await this.gameGateway.inviteGame(gatewayInvitationParamDto);
	}
}
