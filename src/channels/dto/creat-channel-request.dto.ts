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

export class CreateChannelRequestDto {
	@IsString()
	@IsOptional()
	@Length(1, 10)
	@Matches(CHANNEL_NAME_REGEXP)
	name: string | null;

	@IsString()
	@IsEnum(ChannelType)
	channelType: ChannelType;

	@IsString()
	@IsOptional()
	@Length(8, 16)
	@Matches(CHANNEL_PASSWORD_REGEXP)
	password: string | null;

	@IsNumber()
	@IsPositive()
	@IsOptional()
	userId: number;
}
