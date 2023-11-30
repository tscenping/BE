import { IsNotEmpty, IsNumber, IsPositive } from 'class-validator';

export class UpdateChannelUserRequestDto {
	@IsNumber()
	@IsPositive()
	@IsNotEmpty()
	channelUserId: number;
}
