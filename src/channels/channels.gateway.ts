import { InjectRedis } from '@liaoliaots/nestjs-redis';
import {
	Logger,
	UseFilters,
	UseGuards,
	UsePipes,
	ValidationPipe,
} from '@nestjs/common';
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
import { Server } from 'socket.io';
import { UserStatus } from 'src/common/enum';
import { EVENT_ERROR, EVENT_USER_STATUS } from 'src/common/events';
import { WSBadRequestException } from 'src/common/exception/custom-exception';
import { WsFilter } from 'src/common/exception/custom-ws-exception.filter';
import { FriendsRepository } from 'src/friends/friends.repository';
import { User } from 'src/user-repository/entities/user.entity';
import { UsersRepository } from 'src/user-repository/users.repository';
import { SocketWithAuth } from '../common/adapter/socket-io.adapter';
import { WsAuthGuard } from '../common/guards/ws-auth.guard';
import { ChannelUsersRepository } from './channel-users.repository';
import { ChannelNameChangeResponseDto } from './dto/channel-name-change-response.dto';
import { ChannelNoticeResponseDto } from './dto/channel-notice.response.dto';
import { EventMessageOnDto } from './dto/event-message-on.dto';

@WebSocketGateway({ namespace: 'channels' })
@UseGuards(WsAuthGuard)
@UseFilters(WsFilter)
@UsePipes(ValidationPipe)
export class ChannelsGateway
	implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
	private gameQueue: Record<string, User[]> = {
		LADDER: [],
		NORMAL_MATCHING: [],
		SPECIAL_MATCHING: [],
	};
	constructor(
		private readonly usersRepository: UsersRepository,
		private readonly channelUsersRepository: ChannelUsersRepository,
		private readonly friendsRepository: FriendsRepository,
		// private readonly blocksRepository: BlocksRepository,
		@InjectRedis() private readonly redis: Redis,
	) {}

	@WebSocketServer()
	server: Server;

	private readonly logger = new Logger(ChannelsGateway.name);

	afterInit(server: Server) {
		this.logger.log('afterInit!');
		this.server = server;
		// 모든 유저의 소켓 관련 정보를 초기화한다.
		this.usersRepository.initAllSocketIdAndUserStatus();
	}

	async handleConnection(@ConnectedSocket() client: SocketWithAuth) {
		// Socket으로부터 user 정보를 가져온다.

		const user = client.user;
		if (!user || !client.id) return client.disconnect();
		else if (user.channelSocketId) {
			console.log('socket이 이미 존재합니다.');
			const socket = await this.isSocketConnected(user.channelSocketId);
			if (socket) {
				this.server
					.to(socket.id)
					.emit(EVENT_ERROR, 'WS_DUPLICATE_LOGIN_ERROR');
				socket.disconnect();
			} else {
				await this.usersRepository.update(user.id, {
					channelSocketId: null,
					status: UserStatus.OFFLINE,
				});
			}
		}
		this.logger.log(`Client connected: ${client.id}, userId: ${user.id}`);

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

		for (const friendChannelSocketId of friendChannelSocketIdList) {
			this.server
				.to(friendChannelSocketId.channelSocketId)
				.emit(EVENT_USER_STATUS, eventUserStatusEmitDto);
		}
	}

	async handleDisconnect(@ConnectedSocket() client: SocketWithAuth) {
		this.logger.log(`Client disconnected: ${client.id}`);
		const gameQueue = this.gameQueue;
		const user = client.user;
		if (!user || !client.id) {
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

		for (const friendChannelSocketId of friendChannelSocketIdList) {
			this.server
				.to(friendChannelSocketId.channelSocketId)
				.emit(EVENT_USER_STATUS, eventUserStatusEmitDto);
		}
		// 모든 gameQueue에서 해당 user 삭제 (해당되는 user가 아니면 삭제하지 않음)
		Object.keys(gameQueue).forEach((key) => {
			gameQueue[key] = gameQueue[key].filter(
				(userId) => userId.id !== user.id,
			);
		});
		// 유저가 속해있던 채널 룸에서 leave한다.
		client.rooms.clear();
	}

	getGameQueue(): Record<string, User[]> {
		return this.gameQueue;
	}

	@SubscribeMessage('message')
	async handleMessage(
		@ConnectedSocket() client: SocketWithAuth,
		@MessageBody() data: EventMessageOnDto,
	) {
		// Socket으로부터 user 정보를 가져온다.
		const user = client.user;

		if (!user || user.channelSocketId !== client.id) {
			throw WSBadRequestException('유저 정보가 일치하지 않습니다.'); // TODO: exception 발생해도 서버 죽지 않는지 확인
		}

		const { channelId, message } = data;

		// 채널유저 유효성 검사
		const channelUser = await this.channelUsersRepository.findOne({
			where: { userId: user.id, channelId, isBanned: false },
		});
		if (!channelUser) {
			return;
		}

		const eventMessageEmitDto = {
			nickname: user.nickname,
			avatar: user.avatar,
			message,
			channelId,
		};

		// mute된 유저의 socketId List를 가져온다.
		const muteRedisKey = `mute:${channelId}:${user.id}`;
		const isMutedChannelUser = await this.redis.exists(muteRedisKey);

		if (isMutedChannelUser) {
			// TODO: 뮤트 상태에서 메세지 보내면 어떻게 핸들링?
			return;
		}

		// 어떤 user가 보내는지 찾아주기 위해 emit한다. (nickname, message, channelId, notice)
		this.server
			.to(channelId.toString())
			.emit('message', eventMessageEmitDto);
	}

	// 채널을 생성한 경우, 해당 소켓을 채널 룸에 join하는 메서드
	async joinChannelRoom(channelRoomName: string, channelSocketId: string) {
		this.logger.log(
			`joinChannelRoom: ${channelRoomName}, ${channelSocketId}`,
		);

		const socket = await this.isSocketConnected(channelSocketId);
		if (!socket) {
			throw WSBadRequestException('socket이 존재하지 않습니다.');
		}
		this.logger.log(`socket.id: `, socket.id);
		socket.join(channelRoomName);
	}

	// 채널을 나간 경우, 해당 소켓을 채널 룸에서 leave하는 메서드
	async leaveChannelRoom(channelRoomName: string, channelSocketId: string) {
		this.logger.log(
			`leaveChannelRoom: ${channelRoomName}, ${channelSocketId}`,
		);

		const socket = (await this.server.fetchSockets()).find(
			(s) => s.id === channelSocketId,
		);
		if (!socket) {
			throw WSBadRequestException('socket이 존재하지 않습니다.');
		}
		this.logger.log(`socket.id: `, socket.id);
		socket.leave(channelRoomName);
	}

	// 알람 구현을 위한 메소드(한명에게만 알람)
	// async privateAlert(
	// 	gatewayInvitationDto: GatewayCreateChannelInvitationParamDto,
	// ) {
	// 	const isBlocked = await this.blocksRepository.findOne({
	// 		where: { fromUserId: invitedUser.id, toUserId: invitingUser.id },
	// 	});
	// 	if (isBlocked) return;
	//
	// 	this.server
	// 		.to(invitedUser.channelSocketId)
	// 		.emit('privateAlert', invitationEmitDto);
	// }

	// 채널에 소켓 전송
	channelNoticeMessage(
		channelId: number,
		channelNoticeResponseDto: ChannelNoticeResponseDto,
	) {
		this.server
			.to(channelId.toString())
			.emit('notice', channelNoticeResponseDto);
	}

	channelNameChangeMessage(
		channelId: number,
		channelNameChangeResponseDto: ChannelNameChangeResponseDto,
	) {
		this.server
			.to(channelId.toString())
			.emit('nameChange', channelNameChangeResponseDto);
	}

	private async isSocketConnected(ChannelSocketId: string) {
		const socket = (await this.server.fetchSockets()).find(
			(s) => s.id === ChannelSocketId,
		);
		if (!socket) {
			return null;
		}
		return socket;
	}
}
