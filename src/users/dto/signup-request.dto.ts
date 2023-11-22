import { IsNotEmpty, IsString, Length } from 'class-validator';

export class SignupRequestDto {
	@IsNotEmpty()
	@IsString()
	avatar: string;
	@IsNotEmpty()
	@IsString()
	@Length(1, 10)
	nickname: string;
}
