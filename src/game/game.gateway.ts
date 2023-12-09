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
import { GatewayCreateInvitationParamDto } from './dto/gateway-create-invitation-param.dto';
import { UserStatus } from '../common/enum';
import { WSBadRequestException } from '../common/exception/custom-exception';
import { EVENT_GAME_INVITATION } from '../common/events';
import { UseFilters } from '@nestjs/common';
import { WsExceptionFilter } from '../common/exception/custom-ws-exception.filter';

@UseFilters(WsExceptionFilter)
@WebSocketGateway({ namespace: 'game' })
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
	constructor(
		private readonly authService: AuthService,
		private readonly usersRepository: UsersRepository,
	) {}

	@WebSocketServer()
	server: Server;

	async handleConnection(@ConnectedSocket() client: Socket) {
		const user = await this.authService.getUserFromSocket(client);
		if (!user || !client.id || user.gameSocketId)
			return client.disconnect();

		console.log(`${user.id} is connected to game socket {${client.id}}`);

		// 연결된 게임소켓 id를 저장한다.
		await this.usersRepository.update(user.id, {
			gameSocketId: client.id,
		});
	}

	async handleDisconnect(@ConnectedSocket() client: Socket) {
		const user = await this.authService.getUserFromSocket(client);
		if (!user || !client.id || user.gameSocketId) return;

		await this.usersRepository.update(user.id, {
			gameSocketId: null,
		});
		client.rooms.clear();
	}

	async inviteGame(
		gatewayInvitationParamDto: GatewayCreateInvitationParamDto,
	) {
		const invitationId = gatewayInvitationParamDto.invitationId;
		const invitingUserNickname =
			gatewayInvitationParamDto.invitingUserNickname;
		const invitedUserId = gatewayInvitationParamDto.invitedUserId;

		const invitedUser = await this.usersRepository.findOne({
			where: {
				id: invitedUserId,
			},
		});
		if (!invitedUser) {
			throw WSBadRequestException(`user ${invitedUserId} does not exist`);
		}

		// 상대가 접속 중인지 => 접속 중인 유저가 아니라면 없던 일이 됨
		if (
			invitedUser.status === UserStatus.OFFLINE ||
			!invitedUser.gameSocketId
		)
			throw WSBadRequestException('invited user is now offline');

		console.log(`invitation id: ${invitationId}`);
		console.log(`invited user gameSocketId: ${invitedUser.gameSocketId}`);
		this.server.to(invitedUser.gameSocketId).emit(EVENT_GAME_INVITATION, {
			invitationId: invitationId,
			invitingUserNickname: invitingUserNickname,
		});
	}
}
