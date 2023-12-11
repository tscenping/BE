import {
	BadRequestException,
	ImATeapotException,
	Injectable,
} from '@nestjs/common';
import { GameRepository } from './game.repository';
import { UsersRepository } from '../users/users.repository';
import { CreateGameInvitationParamDto } from './dto/create-invitation-param.dto';
import { GatewayCreateInvitationParamDto } from './dto/gateway-create-invitation-param.dto';
import { GameGateway } from './game.gateway';
import { CreateGameParamDto } from './dto/create-game-param.dto';
import { GameInvitationRepository } from './game-invitation.repository';
import { ChannelsGateway } from '../channels/channels.gateway';

@Injectable()
export class GameService {
	constructor(
		private readonly gameRepository: GameRepository,
		private readonly gameInvitationRepository: GameInvitationRepository,
		private readonly gameGateway: GameGateway,
		private readonly channelsGateway: ChannelsGateway,
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

		// Game Invitation DB 저장
		const gameInvitation =
			await this.gameInvitationRepository.createGameInvitation(
				invitationParamDto,
			);

		// TODO: 알림 보내기
		const gatewayInvitationParamDto: GatewayCreateInvitationParamDto = {
			invitationId: gameInvitation.id,
			invitingUserNickname: invitingUser.nickname,
			invitedUserId: invitedUserId,
			gameType: invitationParamDto.gameType,
		};
		await this.channelsGateway.inviteGame(gatewayInvitationParamDto);
	}

	async createGame(createGameParamDto: CreateGameParamDto) {
		const invitationId = createGameParamDto.invitationId;
		const invitedUserId = createGameParamDto.invitedUserId;

		const invitation = await this.gameInvitationRepository.findOne({
			where: {
				id: invitationId,
				invitedUserId: invitedUserId,
			},
		});
		if (!invitation)
			return new ImATeapotException(
				`invitation id ${invitationId}는 존재하지 않습니다`,
			);
		// Game setting
	}

	async deleteInvitation(deleteInvitationParamDto: CreateGameParamDto) {
		const invitationId = deleteInvitationParamDto.invitationId;
		const invitedUserId = deleteInvitationParamDto.invitedUserId;

		const invitation = await this.gameInvitationRepository.findOne({
			where: {
				id: invitationId,
				invitedUserId: invitedUserId,
			},
		});
		if (!invitation)
			return new ImATeapotException(
				`invitation id ${invitationId}는 존재하지 않습니다`,
			);

		// invitation DB 지우기
		await this.gameInvitationRepository.deleteGameInvitaiton(invitationId);
	}
}
