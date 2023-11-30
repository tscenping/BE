import {
	IsEnum,
	IsNumber,
	IsOptional,
	IsPositive,
	IsString,
	Length,
	Matches,
} from 'class-validator';
import {
	CHANNEL_NAME_REGEXP,
	CHANNEL_PASSWORD_REGEXP,
} from 'src/common/constants';
import { ChannelType } from 'src/common/enum';
import { ApiProperty } from '@nestjs/swagger';

export class CreateChannelRequestDto {
	@ApiProperty({ description: '채널이름' })
	@IsString()
	@IsOptional()
	@Length(1, 10)
	@Matches(CHANNEL_NAME_REGEXP)
	name: string | null;

	@ApiProperty({ description: '채널종류 (PUBLIC / PROTECTED / PRIVATE / DM)' })
	@IsString()
	@IsEnum(ChannelType)
	channelType: ChannelType;

	@ApiProperty({ description: '패스워드' })
	@IsString()
	@IsOptional()
	@Length(8, 16)
	@Matches(CHANNEL_PASSWORD_REGEXP)
	password: string | null;

	@ApiProperty({ description: '유저id' })
	@IsNumber()
	@IsPositive()
	@IsOptional()
	userId: number;
}
