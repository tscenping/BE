import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../common/base-entity';
import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import { GameType } from '../../common/enum';

@Entity()
export class GameInvitation extends BaseEntity {
	@Column()
	@IsNotEmpty()
	invitingUserId: number;

	@Column()
	@IsNotEmpty()
	invitedUserId: number;

	@Column()
	@IsNotEmpty()
	@IsString()
	@IsIn([GameType.NORMAL_INVITE, GameType.SPECIAL_INVITE])
	gameType: GameType;
}
