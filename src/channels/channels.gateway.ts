import { Logger } from '@nestjs/common';
import {
	MessageBody,
	OnGatewayConnection,
	OnGatewayDisconnect,
	OnGatewayInit,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthService } from 'src/auth/auth.service';
import { UsersRepository } from 'src/users/users.repository';
import { UsersService } from 'src/users/users.service';

@WebSocketGateway({ namespace: 'channels' })
export class ChannelsGateway
	implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
	constructor(
		private readonly usersService: UsersService,
		private readonly authService: AuthService,
		private readonly usersRepository: UsersRepository,
	) {}

	@WebSocketServer()
	server: Server;

	private logger = new Logger(ChannelsGateway.name);

	afterInit(server: Server) {
		this.logger.log('afteInit!');
		this.server = server;
		// 모든 유저의 소켓 관련 정보를 초기화한다.
		this.usersRepository.initAllSocketIdAndUserStatus();
	}

	async handleConnection(client: Socket, ...args: any[]) {
		const user = await this.authService.getUserFromSocket(client);
		if (!user) {
			return;
		}
		this.logger.log(`Client connected: userId: ${user.id}`);
		this.usersRepository.update(user.id, { channelSocketId: client.id });
	}

	handleDisconnect(client: any) {
		// throw new Error('Method not implemented.');
	}

	@SubscribeMessage('ClientToServer') // TODO: test용 코드. 추후 삭제
	handleMessage(@MessageBody() data: string) {
		this.logger.log('ClientToServer: ', data);
		this.server.emit('ServerToClient', 'Hello Client!');
	}
}
