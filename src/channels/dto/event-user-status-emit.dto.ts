import { IsEnum, IsNumber, IsPositive, IsString } from 'class-validator';
import { UserStatus } from 'src/common/enum';

export class EventUserStatusEmitDto {
	@IsNumber()
	@IsPositive()
	userId: number;

	@IsString()
	@IsEnum(UserStatus)
	status: UserStatus;
}
