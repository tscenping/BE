import { IsNotEmpty } from 'class-validator';

export class BlockUserReturnDto {
	id: number;
	nickname: string;
	@IsNotEmpty()
	avatar: string;
	status: string;
}
