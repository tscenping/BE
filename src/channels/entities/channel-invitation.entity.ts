import { IsNumber, IsPositive } from 'class-validator';
import { BaseEntity } from 'src/common/base-entity';
import { Column, Entity } from 'typeorm';

@Entity()
export class ChannelInvitation extends BaseEntity {
	@Column()
	@IsNumber()
	@IsPositive()
	channelId: number;

	@Column()
	@IsNumber()
	@IsPositive()
	invitingUserId: number;

	@Column()
	@IsNumber()
	@IsPositive()
	invitedUserId: number;
}
