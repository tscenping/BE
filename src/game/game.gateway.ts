import {
	ConnectedSocket,
	MessageBody,
	OnGatewayConnection,
	OnGatewayDisconnect,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer,
} from '@nestjs/websockets';
import { UsersRepository } from '../users/users.repository';
import { Server, Socket } from 'socket.io';
import { AuthService } from '../auth/auth.service';
import { ParseIntPipe, UseFilters } from '@nestjs/common';
import { WsExceptionFilter } from '../common/exception/custom-ws-exception.filter';
import { GatewayCreateGameInvitationParamDto } from './dto/gateway-create-invitation-param.dto';
import {
	EVENT_GAME_INVITATION,
	EVENT_GAME_INVITATION_REPLY,
} from '../common/events';
import { ChannelsGateway } from '../channels/channels.gateway';
import { GatewaySendInvitationReplyDto } from './dto/gateway-send-invitation-reaponse.dto';
import { PositiveIntPipe } from '../common/pipes/positiveInt.pipe';
import { GameRepository } from './game.repository';
import { WSBadRequestException } from '../common/exception/custom-exception';

@WebSocketGateway({ namespace: 'game' })
@UseFilters(WsExceptionFilter)
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
	constructor(
		private readonly authService: AuthService,
		private readonly usersRepository: UsersRepository,
		private readonly gameRepository: GameRepository,
		private readonly channelsGateway: ChannelsGateway,
	) {}

	@WebSocketServer()
	server: Server;
	private connectedClients: Map<number, Socket> = new Map();

	async handleConnection(@ConnectedSocket() client: Socket) {
		const user = await this.authService.getUserFromSocket(client);
		if (!user || !client.id || user.gameSocketId)
			return client.disconnect();

		console.log(`${user.id} is connected to game socket {${client.id}}`);

		// 연결된 게임소켓 id를 저장한다.
		await this.usersRepository.update(user.id, {
			gameSocketId: client.id,
		});
		this.connectedClients.set(user.id, client);
	}

	async handleDisconnect(@ConnectedSocket() client: Socket) {
		const user = await this.authService.getUserFromSocket(client);
		if (!user || client.id !== user.gameSocketId) return;

		await this.usersRepository.update(user.id, {
			gameSocketId: null,
		});
		this.connectedClients.delete(user.id);
		client.rooms.clear();
	}

	async inviteGame(
		gatewayInvitationParamDto: GatewayCreateGameInvitationParamDto,
	) {
		const invitedUserChannelSocketId =
			gatewayInvitationParamDto.invitedUserChannelSocketId;
		const invitationId = gatewayInvitationParamDto.invitationId;
		const invitingUserNickname =
			gatewayInvitationParamDto.invitingUserNickname;
		const gameType = gatewayInvitationParamDto.gameType;

		this.channelsGateway.server
			.to(invitedUserChannelSocketId)
			.emit(EVENT_GAME_INVITATION, {
				invitationId: invitationId,
				invitingUserNickname: invitingUserNickname,
				gameType: gameType,
			});
	}

	async sendInvitationReply(
		sendInvitationReplyDto: GatewaySendInvitationReplyDto,
	) {
		const targetUserChannelSocketId =
			sendInvitationReplyDto.targetUserChannelSocketId;
		const isAccepted = sendInvitationReplyDto.isAccepted;
		const gameId = sendInvitationReplyDto.gameId;

		this.channelsGateway.server
			.to(targetUserChannelSocketId)
			.emit(EVENT_GAME_INVITATION_REPLY, {
				isAccepted: isAccepted,
				gameId: gameId,
			});
	}

	@SubscribeMessage('gameRequest')
	async prepareGame(
		@ConnectedSocket() client: Socket,
		@MessageBody() data: { gameId: number },
	) {
		/* TODO: Game 세팅
		 *	1. game DB 만들기
		 *
		 * 	2. game room join하기 ✅
		 * 	3. game start event emit  ✅*/
		const user = await this.authService.getUserFromSocket(client);
		if (!user) return client.disconnect();

		const game = await this.gameRepository.findOne({
			where: { id: data.gameId },
		});
		if (!game)
			throw WSBadRequestException(
				`해당하는 game id ${data.gameId} 가 없습니다`,
			);

		const player1Socket = this.connectedClients.get(game.winnerId);
		if (!player1Socket)
			throw WSBadRequestException(
				`player1 ${game.winnerId} 소켓이 없습니다`,
			);
		const player2Socket = this.connectedClients.get(game.winnerId);
		if (!player2Socket)
			throw WSBadRequestException(
				`player2 ${game.loserId} 소켓이 없습니다`,
			);
	}
}
