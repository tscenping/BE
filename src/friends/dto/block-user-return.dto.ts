import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BlockUserReturnDto {
	@ApiProperty({ description: 'id' })
	id: number;
	@ApiProperty({ description: '닉네임' })
	nickname: string;
	@ApiProperty({ description: '아바타' })
	avatar: string | null;
	@ApiProperty({ description: '상태(온라인 / 오프라인 / 인게임)' })
	status: string;
}
