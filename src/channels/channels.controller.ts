import {
	BadRequestException,
	Body,
	Controller,
	Delete,
	Get,
	Param,
	ParseIntPipe,
	Patch,
	Post,
	Query,
	UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetUser } from 'src/auth/get-user.decorator';
import { ChannelType } from 'src/common/enum';
import { User } from 'src/users/entities/user.entity';
import { PositiveIntPipe } from '../common/pipes/positiveInt.pipe';
import { ChannelsGateway } from './channels.gateway';
import { ChannelsService } from './channels.service';
import { ChannelInvitationParamDto } from './dto/channel-Invitation.dto';
import { CreateChannelRequestDto } from './dto/creat-channel-request.dto';
import { CreateChannelUserParamDto } from './dto/create-channel-user-param.dto';
import { CreateInvitationParamDto } from './dto/create-invitation-param.dto';
import { CreateInvitationRequestDto } from './dto/create-invitation-request.dto';
import { DeleteChannelInvitationParamDto } from './dto/delete-invitation-param.dto';
import { JoinChannelRequestDto } from './dto/join-channel-request.dto';
import { UpdateChannelPwdParamDto } from './dto/update-channel-pwd-param.dto';
import { UpdateChannelPwdReqeustDto } from './dto/update-channel-pwd-reqeust.dto';
import { UpdateChannelUserRequestDto } from './dto/update-channel-user-request.dto';

@Controller('channels')
@ApiTags('channels')
@UseGuards(AuthGuard('access'))
export class ChannelsController {
	constructor(
		private readonly channelsService: ChannelsService,
		private readonly channelsGateway: ChannelsGateway,
	) {}

	@Post('/')
	@ApiOperation({
		summary: '채널생성',
		description: '채널종류에 따른 채널을 생성한다',
	})
	async createChannel(
		@GetUser() user: User,
		@Body() channelInfo: CreateChannelRequestDto,
	) {
		// 비밀번호가 없는 비공개 채널은 공개 채널로 변경
		if (
			channelInfo.channelType === ChannelType.PROTECTED &&
			!channelInfo.password
		) {
			channelInfo.channelType = ChannelType.PUBLIC;
		}

		// DM 채널인 경우 userId가 필수
		if (channelInfo.channelType === ChannelType.DM && !channelInfo.userId) {
			throw new BadRequestException(`DM을 위한 userId를 입력해주세요.`);
		}

		// DM 채널이 아닌데 channel name이 NULL인 경우 예외 처리
		if (
			channelInfo.channelType !== ChannelType.DM &&
			channelInfo.name === null
		) {
			throw new BadRequestException(`채널 이름을 입력해주세요.`);
		}

		const createChannelResponseDto =
			await this.channelsService.createChannel(user.id, channelInfo);

		if (user.channelSocketId) {
			this.channelsGateway.joinChannelRoom(
				createChannelResponseDto.channelId.toString(),
				user.channelSocketId,
			);
		}

		return createChannelResponseDto;
	}

	@Get('/enter/:channelId')
	@ApiOperation({
		summary: '이미 참여중인 채팅방 입장',
		description:
			'채널 유저 정보를 가지고온다. 이미 참여중인 채널인지 확인하고, 밴 이력이 있는지 확인한다.',
	})
	async enterChannel(
		@GetUser() user: User,
		@Param('channelId', ParseIntPipe, PositiveIntPipe) channelId: number,
	) {
		if (user.channelSocketId) {
			this.channelsGateway.joinChannelRoom(
				channelId.toString(),
				user.channelSocketId,
			);
		}
		return await this.channelsService.enterChannel(user.id, channelId);
	}

	@Patch('/password')
	@ApiOperation({
		summary: '비밀번호 설정/삭제',
		description:
			'채널 주인은 해당 채널에 합류하기 위한 패스워드를 생성, 삭제, 변경이 가능하다.',
	})
	async updateChannelPassword(
		@GetUser() user: User,
		@Body() updateChannelPwdRequestDto: UpdateChannelPwdReqeustDto,
	) {
		const channelId = updateChannelPwdRequestDto.channelId;
		const userId = user.id;
		const password = updateChannelPwdRequestDto.password;

		const updateChannelPwdParam = new UpdateChannelPwdParamDto(
			channelId,
			userId,
			password,
		);
		await this.channelsService.updateChannelTypeAndPassword(
			updateChannelPwdParam,
		);
	}

	@Post('/join')
	@ApiOperation({
		summary: '채널 참여',
		description:
			'존재하는 채널인지 확인하고, 유저가 채널에 존재하는지 확인한다.  Protected로 방이 설정되어 있다면 비밀번호를 확인한다.',
	})
	async createChannelUser(
		@GetUser() user: User,
		@Body() joinChannelRequestDto: JoinChannelRequestDto,
	) {
		const userId = user.id;
		const channelId = joinChannelRequestDto.channelId;
		const password = joinChannelRequestDto.password;

		const channelUserParamDto = new CreateChannelUserParamDto(
			channelId,
			userId,
			password,
		);

		const channelUsersResponseDto =
			await this.channelsService.createChannelUser(channelUserParamDto);

		if (user.channelSocketId) {
			this.channelsGateway.joinChannelRoom(
				channelId.toString(),
				user.channelSocketId,
			);
		}

		return channelUsersResponseDto;
	}

	@Patch('/exit')
	@ApiOperation({
		summary: '채널 나가기',
		description:
			'유저가 채널을 나갈때 사용된다. 만약 유저가 채널에 존재하는 마지막 사람이라면 채널까지 삭제한다.',
	})
	async updateChannelUser(
		@GetUser() user: User,
		@Body('channelId', ParseIntPipe, PositiveIntPipe) channelId: number,
	) {
		console.log(channelId);
		await this.channelsService.updateChannelUser(user.id, channelId);
	}

	@Post('/invite')
	@ApiOperation({ summary: '유저 초대', description: '유저 초대' })
	async createChannelInvitation(
		@GetUser() user: User,
		@Body() createInvitationRequestDto: CreateInvitationRequestDto,
	) {
		const invitingUserId = user.id;
		const channelId = createInvitationRequestDto.channelId;
		const invitedUserId = createInvitationRequestDto.invitedUserId;

		const invitationParamDto = new CreateInvitationParamDto(
			invitingUserId,
			channelId,
			invitedUserId,
		);
		await this.channelsService.createChannelInvitation(invitationParamDto);
	}

	@Patch('/admin')
	@ApiOperation({
		summary: '관리자 유저 임명/해제',
		description:
			'채널주인은 동시에 채널관리인이다. 채널주인은 일반유저를 관리인으로 둘 수 있다.',
	})
	async updateChannelUserType(
		@GetUser() user: User,
		@Body() updateChannelUserRequestDto: UpdateChannelUserRequestDto,
	) {
		const giverUserId = user.id;
		const receiverChannelUserId = updateChannelUserRequestDto.channelUserId;

		const isAdmin = await this.channelsService.updateChannelUserType(
			giverUserId,
			receiverChannelUserId,
		);
		// console.log(isAdmin);
		const updateChannelUserTypeResponseDto = {
			isAdmin: isAdmin,
		};
		return updateChannelUserTypeResponseDto;
	}

	@Patch('/kick')
	@ApiOperation({
		summary: '강퇴하기',
		description: 'giver, receiver에 대한 유효성과 권한을 검증한다.',
	})
	async kickChannelUser(
		@GetUser() user: User,
		@Body() updateChannelUserRequestDto: UpdateChannelUserRequestDto,
	) {
		const giverUserId = user.id;
		const receiverChannelUserId = updateChannelUserRequestDto.channelUserId;

		await this.channelsService.kickChannelUser(
			giverUserId,
			receiverChannelUserId,
		);
	}

	@Patch('/ban')
	@ApiOperation({
		summary: '밴하기',
		description: 'giver, receiver에 대한 유효성과 권한을 검증한다.',
	})
	async banChannelUser(
		@GetUser() user: User,
		@Body() updateChannelUserRequestDto: UpdateChannelUserRequestDto,
	) {
		const giverUserId = user.id;
		const receiverChannelUserId = updateChannelUserRequestDto.channelUserId;

		await this.channelsService.banChannelUser(
			giverUserId,
			receiverChannelUserId,
		);
	}

	@Patch('/mute')
	@ApiOperation({
		summary: '뮤트하기',
		description: 'giver, receiver에 대한 유효성과 권한을 검증한다.',
	})
	async muteChannelUser(
		@GetUser() user: User,
		@Body() updateChannelUserRequestDto: UpdateChannelUserRequestDto,
	) {
		const receiverChannelUserId = updateChannelUserRequestDto.channelUserId;

		await this.channelsService.muteChannelUser(user, receiverChannelUserId);
	}

	// 채널 목록 조회
	@Get('/all')
	@ApiOperation({
		summary: '채널 목록 조회',
		description: 'Public, Protected 채널에 대한 목록을 조회한다.',
	})
	async findAllChannels(
		@GetUser() user: User,
		@Query('page', ParseIntPipe, PositiveIntPipe) page: number,
	) {
		return await this.channelsService.findAllChannels(user.id, page);
	}

	// 내 참여 채널 목록 조회
	@Get('/me')
	@ApiOperation({
		summary: '내 채널 목록 조회',
		description: '내가 참여한 채널에 대한 목록을 조회한다.',
	})
	async findMyChannels(
		@GetUser() user: User,
		@Query('page', ParseIntPipe, PositiveIntPipe) page: number,
	) {
		return await this.channelsService.findMyChannels(user.id, page);
	}

	// 디엠 채널 목록 조회
	@Get('/dm')
	@ApiOperation({
		summary: 'DM 채널 목록 조회',
		description: 'DM 채널에 대한 목록을 조회한다.',
	})
	async findDmChannels(
		@GetUser() user: User,
		@Query('page', ParseIntPipe, PositiveIntPipe) page: number,
	) {
		return await this.channelsService.findDmChannels(user.id, page);
	}

	// 초대 수락
	@Post('/accept')
	@ApiOperation({
		summary: '초대 수락',
		description: '초대 수락',
	})
	async acceptInvitation(
		@GetUser() user: User,
		@Body('invitationId', ParseIntPipe, PositiveIntPipe)
		invitationId: number,
	) {
		const createChannelUserParamDto: ChannelInvitationParamDto = {
			invitedUserId: user.id,
			invitationId: invitationId,
		};
		return await this.channelsService.acceptInvitation(
			createChannelUserParamDto,
		);
	}

	@Delete('/refuse/:channelInvitationId')
	@ApiOperation({
		summary: '초대 거절',
		description: '초대 거절',
	})
	async rejectInvitation(
		@GetUser() user: User,
		@Param('channelinvitationId', ParseIntPipe, PositiveIntPipe)
		invitationId: number,
	) {
		const deleteInvitationParamDto: DeleteChannelInvitationParamDto = {
			cancelingUserId: user.id,
			invitationId: invitationId,
		};
		await this.channelsService.rejectInvitation(deleteInvitationParamDto);
	}
}
