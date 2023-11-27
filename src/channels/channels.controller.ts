import {
	BadRequestException,
	Body,
	Controller,
	Get,
	Param,
	ParseIntPipe,
	Patch,
	Post,
	UseGuards,
} from '@nestjs/common';
import { GetUser } from 'src/auth/get-user.decorator';
import { User } from 'src/users/entities/user.entity';
import { CreateChannelRequestDto } from './dto/create-channel-request.dto';
import { ChannelType } from 'src/common/enum';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { JoinChannelRequestDto } from './dto/join-channel-request.dto';
import { CreateInvitationRequestDto } from './dto/create-invitation-request.dto';
import { PositiveIntPipe } from '../common/pipes/positiveInt.pipe';
import { ChannelsService } from './channels.service';
import { CreatChannelUserParamDto } from './dto/creat-channel-user-param.dto';
import { CreateInvitationParamDto } from './dto/create-invitation-param.dto';
import { UpdateChannelUserRequestDto } from './dto/update-channel-user-request.dto';
import { UpdateChannelPwdReqeustDto } from './dto/update-channel-pwd-reqeust.dto';
import { UpdateChannelPwdParamDto } from './dto/update-channel-pwd-param.dto';

@Controller('channels')
@UseGuards(JwtAuthGuard)
export class ChannelsController {
	constructor(private readonly channelsService: ChannelsService) {}

	@Post('/')
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
			throw new BadRequestException(`userId is required`);
		}

		// DM 채널이 아닌데 channel name이 NULL인 경우 예외 처리
		if (
			channelInfo.channelType !== ChannelType.DM &&
			channelInfo.name === null
		) {
			throw new BadRequestException(`channel name is required`);
		}

		return await this.channelsService.createChannel(user.id, channelInfo);
	}

	/**
	 * 이미 참여 중인 채널에 입장
	 * @param user
	 * @param channelId
	 * @returns
	 */
	@Get('/enter/:channelId')
	async enterChannel(
		@GetUser() user: User,
		@Param('channelId', ParseIntPipe, PositiveIntPipe) channelId: number,
	) {
		return await this.channelsService.enterChannel(user.id, channelId);
	}

	@Patch('/password')
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
	async createChannelUser(
		@GetUser() user: User,
		@Body() joinChannelRequestDto: JoinChannelRequestDto,
	) {
		const userId = user.id;
		const channelId = joinChannelRequestDto.channelId;
		const password = joinChannelRequestDto.password;

		const channelUserParamDto = new CreatChannelUserParamDto(
			channelId,
			userId,
			password,
		);

		const channelUsersResponseDto =
			await this.channelsService.createChannelUser(channelUserParamDto);

		return channelUsersResponseDto;
	}

	@Patch('/exit')
	async updateChannelUser(
		@GetUser() user: User,
		@Body('channelId') channelId: number,
	) {
		await this.channelsService.updateChannelUser(user.id, channelId);
	}

	@Post('/invite')
	async createChannelInvitation(
		@GetUser() user: User,
		@Body()
		createInvitationRequestDto: CreateInvitationRequestDto,
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
	async updateChannelUserType(
		@GetUser() user: User,
		@Body() updateChannelUserRequestDto: UpdateChannelUserRequestDto,
	) {
		const giverUserId = user.id;
		const receiverChannelUserId = updateChannelUserRequestDto.channelUserId;

		await this.channelsService.updateChannelUserType(
			giverUserId,
			receiverChannelUserId,
		);
	}

	@Patch('/kick')
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
	async muteChannelUser(
		@GetUser() user: User,
		@Body() updateChannelUserRequestDto: UpdateChannelUserRequestDto,
	) {
		const giverUserId = user.id;
		const receiverChannelUserId = updateChannelUserRequestDto.channelUserId;

		await this.channelsService.muteChannelUser(
			giverUserId,
			receiverChannelUserId,
		);
	}
}
