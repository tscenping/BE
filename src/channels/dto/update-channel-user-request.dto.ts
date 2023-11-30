import { IsNotEmpty, IsNumber, IsPositive } from 'class-validator';
import { Column } from 'typeorm';

export class UpdateChannelUserRequestDto {
	@Column()
	@IsNumber()
	@IsPositive()
	@IsNotEmpty()
	channelUserId: number;
}
