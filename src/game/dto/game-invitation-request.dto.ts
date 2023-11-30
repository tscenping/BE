import { GameType } from '../../common/enum';
import { IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';


export class GameInvitationRequestDto {
	@ApiProperty({ description: '초대한 유저id' })
	invitedUserId: number;

	// @IsIn([GameType.NORMAL_INVITE, GameType.SPECIAL_INVITE])
	@ApiProperty({ description: '게임종류' })
	gameType: GameType;
}
