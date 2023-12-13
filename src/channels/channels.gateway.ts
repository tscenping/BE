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
import { EVENT_GAME_INVITATION, EVENT_USER_STATUS } from 'src/common/events';
import { WSBadRequestException } from 'src/common/exception/custom-exception';
import { WsExceptionFilter } from 'src/common/exception/custom-ws-exception.filter';
import { FriendsRepository } from 'src/users/friends.repository';
import { UsersRepository } from 'src/users/users.repository';
import { ChannelUsersRepository } from './channel-users.repository';
import { EventMessageOnDto } from './dto/event-message-on.dto';
import { GatewayCreateInvitationParamDto } from '../game/dto/gateway-create-invitation-param.dto';
import { CreateInvitationParamDto } from './dto/create-invitation-param.dto';

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

	private readonly logger = new Logger(ChannelsGateway.name);

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

		for (const friendChannelSocketId of friendChannelSocketIdList) {
			this.server
				.to(friendChannelSocketId.channelSocketId)
				.emit(EVENT_USER_STATUS, eventUserStatusEmitDto);
		}
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

		for (const friendChannelSocketId of friendChannelSocketIdList) {
			this.server
				.to(friendChannelSocketId.channelSocketId)
				.emit(EVENT_USER_STATUS, eventUserStatusEmitDto);
		}

		// 유저가 속해있던 채널 룸에서 leave한다.
		client.rooms.clear();
	}

	@SubscribeMessage('message')
	async handleMessage(
		@ConnectedSocket() client: Socket,
		@MessageBody() data: EventMessageOnDto,
	) {
		// Socket으로부터 user 정보를 가져온다.
		const user = await this.authService.getUserFromSocket(client);

		if (!user || user.channelSocketId !== client.id) {
			throw WSBadRequestException('유저 정보가 일치하지 않습니다.'); // TODO: exception 발생해도 서버 죽지 않는지 확인
		}

		const { channelId, message, notice } = data;

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
			channelId,
			notice,
		};
		// mute된 유저의 socketId List를 가져온다.
		const muteRedisKey = `mute:${channelId}:${user.id}`;
		const isMutedChannelUser = await this.redis.exists(muteRedisKey);

		if (isMutedChannelUser) {
			throw WSBadRequestException('채널에서 음소거 되었습니다.');
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

		const socket = (await this.server.fetchSockets()).find(
			(s) => s.id === channelSocketId,
		);
		if (!socket) {
			return WSBadRequestException('socket이 존재하지 않습니다.');
		}
		this.logger.log(`socket.id: `, socket.id);
		socket.join(channelRoomName);
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
			!invitedUser.channelSocketId
		)
			throw WSBadRequestException('invited user is now offline');

		console.log(`inviting user nickname: ${invitingUserNickname}`);

		this.server
			.to(invitedUser.channelSocketId)
			.emit(EVENT_GAME_INVITATION, {
				invitationId: invitationId,
				invitingUserNickname: invitingUserNickname,
				gameType: gatewayInvitationParamDto.gameType,
			});
	}

	//소켓 연결 해제 시, 채널 룸에서 leave하는 메서드
	@SubscribeMessage('leaveChannelRoom')
	async handleleaveChannelRoom(
		@ConnectedSocket() client: Socket,
		@MessageBody() data: { channelId: number },
	) {
		const user = await this.authService.getUserFromSocket(client);
		if (!user || !client.id || user.channelSocketId !== client.id) {
			return WSBadRequestException('유저 정보가 일치하지 않습니다.');
		}

		const { channelId } = data;

		// 채널유저 유효성 검사
		const channelUser = await this.channelUsersRepository.findOne({
			where: { userId: user.id, channelId, isBanned: false },
		});
		if (!channelUser) {
			throw WSBadRequestException('채널에 속해있지 않습니다.');
		}		
		// 채널에 leave한다.
		client.leave(channelId.toString());

		this.server
			.to(channelId.toString())
			.emit('message', `${user.nickname}님이 퇴장하셨습니다.`);
		
		// 어느 채널에 퇴장했는지 알려주기 위해 front에 emit한다.
		client
			.emit('leaveChannelRoom', channelId.toString());
	}	
	
	// 알람 구현을 위한 메소드(한명에게만 알람)
	async PrivateAlert(
		data: { invitedUserId: number, invitationId: number }
	) {
		const invitedUser = await this.usersRepository.findOne({
			where: { id: data.invitedUserId },
		});
		const invitationId = data.invitationId;

		if (!invitedUser || invitedUser.status === UserStatus.OFFLINE || !invitedUser.channelSocketId) {
			throw WSBadRequestException('유저가 유효하지 않습니다.');
		}
		this.server.to(invitedUser.channelSocketId).emit('privateAlert', invitationId);
	}
}
