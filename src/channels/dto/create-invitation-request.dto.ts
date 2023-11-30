import { Column } from 'typeorm';
import { IsNotEmpty, IsNumber, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateInvitationRequestDto {
	@ApiProperty({ description: '채널id' })
	@Column()
	@IsNumber()
	@IsPositive()
	@IsNotEmpty()
	channelId: number;

	@ApiProperty({ description: '초대한 유저id' })
	@Column()
	@IsNumber()
	@IsPositive()
	@IsNotEmpty()
	invitedUserId: number;
}
