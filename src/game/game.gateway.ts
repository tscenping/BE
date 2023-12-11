import {
	ConnectedSocket,
	OnGatewayConnection,
	OnGatewayDisconnect,
	WebSocketGateway,
	WebSocketServer,
} from '@nestjs/websockets';
import { UsersRepository } from '../users/users.repository';
import { Server, Socket } from 'socket.io';
import { AuthService } from '../auth/auth.service';
import { WSBadRequestException } from '../common/exception/custom-exception';
import { UseFilters, UsePipes, ValidationPipe } from '@nestjs/common';
import { WsExceptionFilter } from '../common/exception/custom-ws-exception.filter';
import { GatewayJoinRoomParamDto } from './dto/gateway-join-room-param.dto';
import { GameInvitation } from './entities/game-invitation.entity';

@WebSocketGateway({ namespace: 'game' })
@UseFilters(WsExceptionFilter)
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
	constructor(
		private readonly authService: AuthService,
		private readonly usersRepository: UsersRepository,
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

	gameSetting(invitation: GameInvitation) {
		// 1. Game DB 생성하기

		// 2. 초대 해 준 사람이랑 같이 room에 들어가기
		const invitingUserId = invitation.invitingUserId;
		const invitedUserId = invitation.invitedUserId;
		const gatewayJoinRoomParamDto: GatewayJoinRoomParamDto = {
			invitingUserId: invitingUserId,
			invitedUserId: invitedUserId,
			roomName: `${invitingUserId}:${invitedUserId}`,
		};
		this.joinGameRoom(gatewayJoinRoomParamDto);

		// game start emit ?
	}

	joinGameRoom(gatewayJoinRoomParamDto: GatewayJoinRoomParamDto) {
		const invitingUserId = gatewayJoinRoomParamDto.invitingUserId;
		const invitedUserId = gatewayJoinRoomParamDto.invitedUserId;
		const room = gatewayJoinRoomParamDto.roomName;

		const invitingUserSocket = this.connectedClients.get(invitingUserId);
		if (!invitingUserSocket)
			throw WSBadRequestException(
				`${invitingUserId} 는 연결되지 않은 클라이언트입니다`,
			);
		const invitedUserSocket = this.connectedClients.get(invitedUserId);
		if (!invitedUserSocket)
			throw WSBadRequestException(
				`${invitedUserId} 는 연결되지 않은 클라이언트입니다`,
			);

		invitingUserSocket.join(room);
		invitedUserSocket.join(room);
	}
}
