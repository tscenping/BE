import { IsNotEmpty } from 'class-validator';

export class BlockUserReturnDto {
	id: string;
	nickname: string;
	@IsNotEmpty()
	avatar: string;
	status: string;
}
