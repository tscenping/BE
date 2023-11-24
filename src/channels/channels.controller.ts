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
import { ChannelInvitationService } from './channel-invitation.service';
import { ChannelUsersResponseDto } from './dto/channel-users-response.dto';

@Controller('channels')
@UseGuards(JwtAuthGuard)
export class ChannelsController {
	constructor(
		private readonly channelsService: ChannelsService,
		private readonly channelInvitationService: ChannelInvitationService,
	) {}

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

	@Post('/join')
	async createChannelUser(
		@GetUser() user: User,
		@Body() joinChannelRequestDto: JoinChannelRequestDto,
	) {
		const userId = user.id;
		const channelId = joinChannelRequestDto.channelId;
		const password = joinChannelRequestDto.password;

		const channelUsersResponseDto =
			await this.channelsService.createChannelUser({
				channelId,
				userId,
				password,
			});

		return channelUsersResponseDto;
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

		await this.channelsService.createChannelInvitation({
			invitingUserId,
			channelId,
			invitedUserId,
		});
	}

	@Patch('/exit')
	async updateChannel(
		@GetUser() user: User,
		@Body('channelId') channelId: number,
	) {
		await this.channelsService.updateChannel(user.id, channelId);
	}
}
