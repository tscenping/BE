import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';

export class EventMessageOnDto {
	@IsString()
	@IsNotEmpty()
	message: string;

	@IsNumber()
	@IsPositive()
	@IsNotEmpty()
	channelId: number;

	@IsString()
	@IsNotEmpty()
	// 따로 리터럴이 지정되지 않으면 디폴트로 'MESSAGE'가 들어간다.
	notice: 'ADMIN' | 'BAN' | 'KICK' | 'MUTE'| 'JOIN' | 'EXIT' | 'MESSAGE' = 'MESSAGE';
}
