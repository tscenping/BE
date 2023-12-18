import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive, IsString, Length } from 'class-validator';

export class SigninMfaRequestDto {
	@ApiProperty({ description: '유저 id' })
	@IsNumber()
	@IsPositive()
	userId: number;

	@ApiProperty({ description: 'mfa code' })
	@IsString()
	@Length(6, 6)
	token: string;
}
