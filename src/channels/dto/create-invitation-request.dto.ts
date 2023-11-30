import { Column } from 'typeorm';
import { IsNotEmpty, IsNumber, IsPositive } from 'class-validator';

export class CreateInvitationRequestDto {
	@Column()
	@IsNumber()
	@IsPositive()
	@IsNotEmpty()
	channelId: number;

	@Column()
	@IsNumber()
	@IsPositive()
	@IsNotEmpty()
	invitedUserId: number;
}
