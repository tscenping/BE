import { Column } from 'typeorm';
import {
	IsNotEmpty,
	IsNumber,
	IsPositive,
	IsString,
	Length,
	Matches,
} from 'class-validator';
import { CHANNEL_NAME_REGEXP } from '../../common/constants';

export class UpdateChannelNameRequestDto {
	@Column()
	@IsNumber()
	@IsPositive()
	@IsNotEmpty()
	channelId: number;

	@IsString()
	@Length(1, 10)
	@Matches(CHANNEL_NAME_REGEXP)
	@IsNotEmpty()
	newName: string;
}
