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
import { UseFilters } from '@nestjs/common';
import { WsExceptionFilter } from '../common/exception/custom-ws-exception.filter';
import { GatewayCreateGameInvitationParamDto } from './dto/gateway-create-invitation-param.dto';
import {
	EVENT_GAME_INVITATION,
	EVENT_GAME_INVITATION_REPLY,
	EVENT_GAME_READY,
} from '../common/events';
import { ChannelsGateway } from '../channels/channels.gateway';
import { GatewaySendInvitationReplyDto } from './dto/gateway-send-invitation-reaponse.dto';
import { GameRepository } from './game.repository';
import { WSBadRequestException } from '../common/exception/custom-exception';
import { GameDto } from './dto/game.dto';

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
	private userIdToClient: Map<number, Socket> = new Map();
	private userIdToGameId: Map<number, number> = new Map();
	private gameIdToGameDto: Map<number, GameDto> = new Map();

	async handleConnection(@ConnectedSocket() client: Socket) {
		const user = await this.authService.getUserFromSocket(client);
		if (!user || !client.id || user.gameSocketId)
			return client.disconnect();

		console.log(`${user.id} is connected to game socket {${client.id}}`);

		// 연결된 게임소켓 id를 저장한다.
		await this.usersRepository.update(user.id, {
			gameSocketId: client.id,
		});
		this.userIdToClient.set(user.id, client);
	}

	async handleDisconnect(@ConnectedSocket() client: Socket) {
		const user = await this.authService.getUserFromSocket(client);
		if (!user || client.id !== user.gameSocketId) return;

		await this.usersRepository.update(user.id, {
			gameSocketId: null,
		});
		this.userIdToClient.delete(user.id);
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
		const targetUserId = sendInvitationReplyDto.targetUserId;
		const targetUserChannelSocketId =
			sendInvitationReplyDto.targetUserChannelSocketId;
		const isAccepted = sendInvitationReplyDto.isAccepted;
		const gameId = sendInvitationReplyDto.gameId;
		// gameId 저장하기
		if (isAccepted && gameId) this.userIdToGameId.set(targetUserId, gameId);

		this.channelsGateway.server
			.to(targetUserChannelSocketId)
			.emit(EVENT_GAME_INVITATION_REPLY, {
				isAccepted: isAccepted,
				gameId: gameId,
			});
	}

	@SubscribeMessage('gameRequest')
	async prepareGame(@ConnectedSocket() client: Socket) {
		/* TODO: Game 세팅
		 *	1. game Data 만들기
		 *
		 * 	2. map 준비하기
		 * 	3. game room join하기 ✅
		 * 	4. game start event emit ✅*/
		const user = await this.authService.getUserFromSocket(client);
		if (!user) return client.disconnect();
		const gameId = this.userIdToGameId.get(user.id);

		const game = await this.gameRepository.findOne({
			where: { id: gameId },
		});
		if (!game)
			throw WSBadRequestException(
				`gameId ${gameId} 가 유효하지 않습니다`,
			);

		const gameDto = new GameDto(game);
		if (!this.gameIdToGameDto.get(game.id))
			this.gameIdToGameDto.set(game.id, gameDto);

		const player1Socket = this.userIdToClient.get(gameDto.player1Id);
		const player2Socket = this.userIdToClient.get(gameDto.player2Id);
		if (!player1Socket || !player2Socket)
			throw WSBadRequestException(
				`두 플레이어의 게임 소켓이 모두 필요합니다. 게임 불가`,
			);
		player1Socket.join(gameDto.getGameId().toString());
		player2Socket.join(gameDto.getGameId().toString());

		// 프론트 무슨 데이터 필요한지 ?
		this.server.to(player1Socket.id).emit(EVENT_GAME_READY, {});
		this.server.to(player2Socket.id).emit(EVENT_GAME_READY, {});
	}

	@SubscribeMessage('gameStart')
	async gameStart(@ConnectedSocket() client: Socket) {}
}
