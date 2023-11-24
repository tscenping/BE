import {
	BadRequestException,
	Body,
	Controller,
	Get,
	Param,
	ParseIntPipe,
	Post,
	UseGuards,
} from '@nestjs/common';
import { GetUser } from 'src/auth/get-user.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ChannelType } from 'src/common/enum';
import { User } from 'src/users/entities/user.entity';
import { ChannelsService } from './channels.service';
import { CreateChannelRequestDto } from './dto/create-channel-request.dto';
import { PositiveIntPipe } from 'src/common/pipes/positiveInt.pipe';

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
}
