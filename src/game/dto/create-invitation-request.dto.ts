import { GameType } from '../../common/enum';
import { IsIn, IsInt, IsPositive, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateGameInvitationRequestDto {
	@ApiProperty({ description: '초대한 유저id' })
	@IsInt()
	@IsPositive()
	invitedUserId: number;

	@ApiProperty({ description: '게임종류' })
	@IsIn([GameType.NORMAL_INVITE, GameType.SPECIAL_INVITE])
	@IsString()
	gameType: GameType;
}
