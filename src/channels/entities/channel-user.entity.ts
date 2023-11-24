import {
	IsEnum,
	IsNumber,
	IsOptional,
	IsPositive,
	IsString,
} from 'class-validator';
import { BaseEntity } from 'src/common/base-entity';
import { ChannelUserType } from 'src/common/enum';
import { Column, Entity } from 'typeorm';

@Entity()
export class ChannelUser extends BaseEntity {
	@Column()
	@IsNumber()
	@IsPositive()
	channelId: number;

	@Column()
	@IsNumber()
	@IsPositive()
	userId: number;

	@Column({ default: ChannelUserType.MEMBER })
	@IsString()
	@IsEnum(ChannelUserType)
	channelUserType: ChannelUserType;

	@Column({ default: false })
	@IsOptional()
	isBanned: boolean;
}
