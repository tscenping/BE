import {
	IsEnum,
	IsNumber,
	IsOptional,
	IsPositive,
	IsString,
	Length,
	Matches,
} from 'class-validator';
import { CHANNEL_PASSWORD_REGEXP } from 'src/common/constants';
import { ChannelType } from 'src/common/enum';

export class CreateChannelRequestDto {
	@IsString()
	name: string;

	@IsString()
	@IsEnum(ChannelType)
	channelType: ChannelType;

	@IsString()
	@IsOptional()
	@Length(1, 10)
	@Matches(CHANNEL_PASSWORD_REGEXP, {
		message: 'password must be alphanumeric',
	})
	password: string | null;

	@IsNumber()
	@IsPositive()
	@IsOptional()
	userId: number;
}
