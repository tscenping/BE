import { InjectRedis } from '@liaoliaots/nestjs-redis';
import { Logger, UseFilters, UsePipes, ValidationPipe } from '@nestjs/common';
import {
	ConnectedSocket,
	MessageBody,
	OnGatewayConnection,
	OnGatewayDisconnect,
	OnGatewayInit,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer,
} from '@nestjs/websockets';
import Redis from 'ioredis';
import { Server, Socket } from 'socket.io';
import { AuthService } from 'src/auth/auth.service';
import { UserStatus } from 'src/common/enum';
import { EVENT_USER_STATUS } from 'src/common/events';
import { WSBadRequestException } from 'src/common/exception/custom-exception';
import { WsExceptionFilter } from 'src/common/exception/custom-ws-exception.filter';
import { FriendsRepository } from 'src/users/friends.repository';
import { UsersRepository } from 'src/users/users.repository';
import { ChannelUsersRepository } from './channel-users.repository';
import { EventMessageOnDto } from './dto/event-message-on.dto';

@WebSocketGateway({ namespace: 'channels' })
@UseFilters(WsExceptionFilter)
@UsePipes(new ValidationPipe())
export class ChannelsGateway
	implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
	constructor(
		private readonly authService: AuthService,
		private readonly usersRepository: UsersRepository,
		private readonly channelUsersRepository: ChannelUsersRepository,
		private readonly friendsRepository: FriendsRepository,
		@InjectRedis() private readonly redis: Redis,
	) {}

	@WebSocketServer()
	server: Server;

	private logger = new Logger(ChannelsGateway.name);

	afterInit(server: Server) {
		this.logger.log('afterInit!');
		this.server = server;
		// 모든 유저의 소켓 관련 정보를 초기화한다.
		this.usersRepository.initAllSocketIdAndUserStatus();
	}

	async handleConnection(@ConnectedSocket() client: Socket, ...args: any[]) {
		// Socket으로부터 user 정보를 가져온다.
		const user = await this.authService.getUserFromSocket(client);
		if (!user || !client.id || user.channelSocketId) {
			return client.disconnect();
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
		// 유저의 친구 중 channelSocketId가 존재하는 친구들에게만 알린다.
		const friendChannelSocketIdList =
			await this.friendsRepository.findAllFriendChannelSocketIdByUserId(
				user.id,
			);
		const eventUserStatusEmitDto = {
			userId: user.id,
			status: UserStatus.ONLINE,
		};
		this.server
			.to(friendChannelSocketIdList)
			.emit(EVENT_USER_STATUS, eventUserStatusEmitDto);
	}

	async handleDisconnect(@ConnectedSocket() client: Socket) {
		this.logger.log(`Client disconnected: ${client.id}`);

		const user = await this.authService.getUserFromSocket(client);
		if (!user || client.id !== user.channelSocketId) {
			return;
		}

		// 유저의 channelSocketId와 status를 업데이트한다.
		await this.usersRepository.update(user.id, {
			channelSocketId: null,
			status: UserStatus.OFFLINE,
		});

		// 유저의 offline 상태를 유저의 친구들에게 알린다.
		// 유저의 친구 중 channelSocketId가 존재하는 친구들에게만 알린다.
		const friendChannelSocketIdList =
			await this.friendsRepository.findAllFriendChannelSocketIdByUserId(
				user.id,
			);
		const eventUserStatusEmitDto = {
			userId: user.id,
			status: UserStatus.OFFLINE,
		};
		this.server
			.to(friendChannelSocketIdList)
			.emit(EVENT_USER_STATUS, eventUserStatusEmitDto);

		// 유저가 속해있던 채널 룸에서 leave한다.
		client.rooms.clear();
	}

	@SubscribeMessage('message')
	async handleMessage(
		@ConnectedSocket() client: Socket,
		@MessageBody() data: EventMessageOnDto,
	) {
		this.logger.log(`handleMessage: ${JSON.stringify(data)}`); // TODO: test code. 추후 삭제

		// Socket으로부터 user 정보를 가져온다.
		const user = await this.authService.getUserFromSocket(client);

		if (!user || user.channelSocketId !== client.id) {
			throw WSBadRequestException('유저 정보가 일치하지 않습니다.'); // TODO: exception 발생해도 서버 죽지 않는지 확인
		}

		const { channelId, message } = data;

		// 채널유저 유효성 검사
		const channelUser = await this.channelUsersRepository.findOne({
			where: { userId: user.id, channelId, isBanned: false },
		});
		if (!channelUser) {
			throw WSBadRequestException('채널에 속해있지 않습니다.');
		}

		const eventMessageEmitDto = {
			nickname: user.nickname,
			message,
		};
		// mute된 유저의 socketId List를 가져온다.
		const muteRedisKey = `mute:${channelId}:${user.id}`;
		// console.log('muteRedisKey:', muteRedisKey);
		const isMutedChannelUser = await this.redis.exists(muteRedisKey);

		if (isMutedChannelUser) {
			throw WSBadRequestException('채널에서 음소거 되었습니다.');
		}
		// console.log('muteRedisKey:', muteRedisKey);

		// 채널에 메시지를 emit한다.
		this.server
			.to(channelId.toString())
			.emit('message', eventMessageEmitDto);
	}

	@SubscribeMessage('ClientToServer') // TODO: test용 코드. 추후 삭제
	handleMessageTest(
		@ConnectedSocket() client: Socket,
		@MessageBody() data: string,
	) {
		this.logger.log(`client TEST: `, client);
		this.logger.log('ClientToServer: ', data);
		this.server.emit('ServerToClient', 'Hello Client!');
	}
}
