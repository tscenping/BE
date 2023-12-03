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
import { UserStatus } from 'src/common/enum';
import { UsersRepository } from 'src/users/users.repository';
import { UsersService } from 'src/users/users.service';
import { ChannelUsersRepository } from './channel-users.repository';
import { stringify } from 'querystring';
import { FriendsRepository } from 'src/users/friends.repository';

@WebSocketGateway({ namespace: 'channels' })
export class ChannelsGateway
	implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
	constructor(
		private readonly usersService: UsersService,
		private readonly authService: AuthService,
		private readonly usersRepository: UsersRepository,
		private readonly channelUsersRepository: ChannelUsersRepository,
		private readonly friendsRepository: FriendsRepository,
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
		// Socket으로부터 user 정보를 가져온다.
		const user = await this.authService.getUserFromSocket(client);
		if (!user) {
			return;
		}
		this.logger.log(`Client connected: userId: ${user.id}`);

		// 유저의 channelSocketId와 status를 업데이트한다.
		await this.usersRepository.update(user.id, {
			channelSocketId: client.id,
			status: UserStatus.ONLINE,
		});

		// 유저가 속해있던 채널 룸에 join한다.
		const channelList =
			await this.channelUsersRepository.findAllChannelByUserId(user.id);
		channelList.forEach((channel) => {
			client.join(channel.id.toString());
		});

		// 유저의 online 상태를 유저의 친구들에게 알린다.
		const friendChannelSocketIdList =
			await this.friendsRepository.findAllFriendChannelSocketIdByUserId(
				user.id,
			);
		friendChannelSocketIdList.forEach((friendChannelSocketId: string) => {
			// TODO: online 상태 이벤트
		});
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
