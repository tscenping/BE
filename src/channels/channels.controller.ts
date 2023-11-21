import {
	BadRequestException,
	Body,
	Controller,
	Post,
	UseGuards,
	ValidationPipe,
} from '@nestjs/common';
import { ChannelsService } from './channels.service';
import { GetUser } from 'src/auth/get-user.decorator';
import { User } from 'src/users/entities/user.entity';
import { CreateChannelRequestDto } from './dto/create-channel-request.dto';
import { ChannelType } from 'src/common/enum';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

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
}
