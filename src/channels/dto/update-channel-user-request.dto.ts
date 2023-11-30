import { IsNotEmpty, IsNumber, IsPositive } from 'class-validator';
import { Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateChannelUserRequestDto {
	@ApiProperty({ description: '채널 유저 id' })
	@Column()
	@IsNumber()
	@IsPositive()
	@IsNotEmpty()
	channelUserId: number;
}
