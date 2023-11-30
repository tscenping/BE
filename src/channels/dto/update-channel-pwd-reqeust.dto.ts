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
import { ApiProperty } from '@nestjs/swagger';

export class UpdateChannelPwdReqeustDto {
	@ApiProperty({ description: '채널id' })
	@Column()
	@IsNumber()
	@IsPositive()
	@IsNotEmpty()
	channelId: number;

	@ApiProperty({ description: '패스워드' })
	@Column({ type: 'varchar' })
	@IsString()
	@Length(8, 16)
	@Matches(CHANNEL_PASSWORD_REGEXP)
	@IsOptional()
	password: string | null;
}
