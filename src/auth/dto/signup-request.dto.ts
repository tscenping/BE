import { IsNotEmpty, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';


export class SignupRequestDto {
	@ApiProperty({ description: '아바타' })
	@IsNotEmpty()
	avatar: boolean;
	@ApiProperty({ description: '닉네임' })
	@IsNotEmpty()
	@IsString()
	@Length(1, 10)
	nickname: string;
}
