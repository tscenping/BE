import { Column } from 'typeorm';
import {
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsPositive,
	IsString,
	Length,
	Matches,
} from 'class-validator';
import { CHANNEL_PASSWORD_REGEXP } from '../../common/constants';

export class UpdateChannelPwdReqeustDto {
	@Column()
	@IsNumber()
	@IsPositive()
	@IsNotEmpty()
	channelId: number;

	@Column({ type: 'varchar' })
	@IsString()
	@Length(8, 16)
	@Matches(CHANNEL_PASSWORD_REGEXP)
	@IsOptional()
	password: string | null;
}
