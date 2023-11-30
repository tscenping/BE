import { ApiProperty } from '@nestjs/swagger';

export class ChannelListReturnDto {
	@ApiProperty({ description: '채널id' })
	channelId: number;
	@ApiProperty({ description: '채널이름' })
	channelName: string;
	@ApiProperty({ description: '채널종류' })
	channelType: number;
	@ApiProperty({ description: '채널에 존재하는 유저 숫자' })
	userCount: number;
}
