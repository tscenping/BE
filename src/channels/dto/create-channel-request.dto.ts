import {
	IsEnum,
	IsNumber,
	IsOptional,
	IsPositive,
	IsString,
	Length,
	Matches,
} from 'class-validator';
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
	@Matches(/^[a-zA-Z0-9]*$/, {
		message: 'password must be alphanumeric',
	})
	password: string | null;

	@IsNumber()
	@IsPositive()
	@IsOptional()
	userId: number | null;
}
