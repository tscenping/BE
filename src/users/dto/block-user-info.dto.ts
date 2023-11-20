import { IsNotEmpty } from 'class-validator';

export class BlockUserInfoDto {
	id: string;
	nickname: string;
	@IsNotEmpty()
	avatar: string;
	status: string;
}
