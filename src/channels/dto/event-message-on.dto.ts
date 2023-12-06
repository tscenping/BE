import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';

export class EventMessageOnDto {
	@IsString()
	@IsNotEmpty()
	message: string;

	@IsNumber()
	@IsPositive()
	@IsNotEmpty()
	channelId: number;
}
