import {
	BadRequestException,
	Body,
	Controller,
	Get,
	Param,
	ParseIntPipe,
	Patch,
	Post,
	Query,
	UseGuards,
} from '@nestjs/common';
import { GetUser } from 'src/auth/get-user.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ChannelType } from 'src/common/enum';
import { User } from 'src/users/entities/user.entity';
import { PositiveIntPipe } from '../common/pipes/positiveInt.pipe';
import { ChannelsService } from './channels.service';
import { CreateChannelRequestDto } from './dto/creat-channel-request.dto';
import { CreateChannelUserParamDto } from './dto/create-channel-user-param.dto';
import { CreateInvitationParamDto } from './dto/create-invitation-param.dto';
import { CreateInvitationRequestDto } from './dto/create-invitation-request.dto';
import { JoinChannelRequestDto } from './dto/join-channel-request.dto';
// import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('channels')
// @ApiTags('channels')
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

	@Post('/join')
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

		const invitationParamDto = new CreateInvitationParamDto(
			invitingUserId,
			channelId,
			invitedUserId,
		);
		await this.channelsService.createChannelInvitation(invitationParamDto);
	}

	@Patch('/exit')
	async updateChannel(
		@GetUser() user: User,
		@Body('channelId') channelId: number,
	) {
		await this.channelsService.updateChannel(user.id, channelId);
	}

	// 채널 목록 조회
	@Get('/all')
	async findAllChannels(
		@Query('page', ParseIntPipe, PositiveIntPipe) page: number,
	) {
		return await this.channelsService.findAllChannels(page);
	}

	// 내 참여 채널 목록 조회
	@Get('/me')
	async findMyChannels(
		@GetUser() user: User,
		@Query('page', ParseIntPipe, PositiveIntPipe) page: number,		
	) {
		return await this.channelsService.findMyChannels(user.id, page);
	}

	// 디엠 채널 목록 조회
	@Get('/dm')
	async findDmChannels(
		@GetUser() user: User,
		@Query('page', ParseIntPipe, PositiveIntPipe) page: number,
	) {
		return await this.channelsService.findDmChannels(user.id, page);
	}

}

